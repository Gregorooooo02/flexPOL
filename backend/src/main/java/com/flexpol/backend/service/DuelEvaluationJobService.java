package com.flexpol.backend.service;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.flexpol.backend.config.DuelProperties;
import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.entity.DuelFailureReason;
import com.flexpol.backend.entity.DuelMatch;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.entity.DuelResult;
import com.flexpol.backend.model.DuelEvaluationWork;
import com.flexpol.backend.model.DuelMarketSpec;
import com.flexpol.backend.model.DuelScenarioSpec;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.DuelResultRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Short transaction boundaries, separate from the non-transactional simulation worker. */
@Service
@RequiredArgsConstructor
@Transactional
public class DuelEvaluationJobService {

	private final DuelMatchRepository matches;
	private final DuelResultRepository results;
	private final JsonMapper jsonMapper;
	private final Clock clock;
	private final DuelProperties properties;
	private final DuelEvents events;

	@Transactional(readOnly = true)
	public List<UUID> findPendingIds() {
		return matches.findEvaluationIds(DuelPhase.EVALUATING, clock.instant(), PageRequest.of(0, 100));
	}

	public Optional<DuelEvaluationWork> claim(UUID matchId) {
		var found = matches.findLockedById(matchId);
		if (found.isEmpty()) return Optional.empty();
		var match = found.get();
		var now = clock.instant();
		if (match.getPhase() != DuelPhase.EVALUATING || (match.getEvaluationClaimToken() != null
				&& now.isBefore(match.getEvaluationClaimExpiresAt()))) return Optional.empty();
		if (match.getEvaluationAttempts() >= properties.evaluationMaxAttempts()) {
			failMatch(match, DuelFailureReason.EVALUATION_TIMEOUT);
			return Optional.empty();
		}
		var token = UUID.randomUUID();
		DuelEvaluationWork work;
		try {
			var scenario = jsonMapper.readValue(match.getScenarioJson(), DuelScenarioSpec.class);
			DuelMarketSpec market = jsonMapper.readerFor(DuelMarketSpec.class)
					.with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS).readValue(match.getMarketJson());
			if (match.getParticipants().size() != 2 || match.getParticipants().stream().anyMatch(player -> player.getSubmittedAt() == null)) {
				throw new IllegalStateException("Evaluation requires two submitted players");
			}
			var players = match.getParticipants().stream().map(player -> new DuelEvaluationWork.Player(player.getUser().getId(),
					player.getUser().getUsername(), player.getSeat(), player.getAllocations().stream()
							.map(allocation -> new DuelEvaluationWork.Allocation(allocation.getInstrumentId(), allocation.getAmount())).toList())).toList();
			work = new DuelEvaluationWork(matchId, token, scenario, market, players);
		} catch (RuntimeException invalidInput) {
			// No parser exception is exposed/logged: it could contain fragments of the secret JSON.
			failMatch(match, DuelFailureReason.EVALUATION_ERROR);
			return Optional.empty();
		}
		match.setEvaluationAttempts(match.getEvaluationAttempts() + 1);
		match.setEvaluationClaimToken(token);
		match.setEvaluationClaimExpiresAt(now.plus(properties.evaluationLease()));
		return Optional.of(work);
	}

	public boolean complete(DuelEvaluationWork work, DuelResultResponse payload) {
		var match = matches.findLockedById(work.matchId()).orElseThrow();
		if (!ownsLiveClaim(match, work)) return false;
		if (!work.matchId().equals(payload.matchId())) {
			throw new IllegalArgumentException("Evaluation result belongs to a different match");
		}
		var result = new DuelResult();
		result.setMatch(match);
		result.setMatchId(match.getId());
		result.setResultJson(jsonMapper.writeValueAsString(payload));
		results.saveAndFlush(result);
		match.setPhase(DuelPhase.EVALUATED);
		match.setEvaluatedAt(payload.completedAt());
		// Assigned exactly once at result commit, never from a browser or a replay read.
		match.setReplayStartsAt(clock.instant().plus(properties.replayLeadIn()));
		match.setReplayEndsAt(match.getReplayStartsAt().plus(properties.replayDuration()));
		clearClaim(match);
		match.setRevision(match.getRevision() + 1);
		events.match(match, DuelEvents.participants(match), false);
		return true;
	}

	public boolean fail(DuelEvaluationWork work) {
		var match = matches.findLockedById(work.matchId()).orElseThrow();
		if (!ownsLiveClaim(match, work)) return false;
		failMatch(match, DuelFailureReason.EVALUATION_ERROR);
		return true;
	}

	private boolean ownsLiveClaim(DuelMatch match, DuelEvaluationWork work) {
		return match.getPhase() == DuelPhase.EVALUATING && work.claimToken().equals(match.getEvaluationClaimToken())
				&& clock.instant().isBefore(match.getEvaluationClaimExpiresAt());
	}

	private void failMatch(DuelMatch match, DuelFailureReason reason) {
		match.setPhase(DuelPhase.FAILED);
		match.setFailureReason(reason);
		match.setFailedAt(clock.instant());
		clearClaim(match);
		match.setRevision(match.getRevision() + 1);
		events.match(match, DuelEvents.participants(match), false);
	}

	private static void clearClaim(DuelMatch match) {
		match.setEvaluationClaimToken(null);
		match.setEvaluationClaimExpiresAt(null);
	}
}

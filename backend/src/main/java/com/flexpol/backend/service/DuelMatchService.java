package com.flexpol.backend.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.flexpol.backend.config.DuelProperties;
import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.DuelScenarioResponse;
import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.entity.DuelAllocation;
import com.flexpol.backend.entity.DuelCancellationReason;
import com.flexpol.backend.entity.DuelMatch;
import com.flexpol.backend.entity.DuelParticipant;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.entity.DuelSubmissionSource;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.exception.ResourceNotFoundException;
import com.flexpol.backend.model.DuelScenarioSpec;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.UserRepository;
import com.flexpol.backend.repository.DuelResultRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;

/**
 * Internal game API. Callers must resolve a trusted current learner before passing their ID.
 * All match access is serialized by the match row; creation additionally locks the two users.
 */
@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = DuelConflictException.class)
public class DuelMatchService {

	private static final Set<DuelPhase> RESULT_PHASES = Set.of(DuelPhase.EVALUATED, DuelPhase.REPLAY, DuelPhase.FINISHED);

	private final DuelMatchRepository matchRepository;
	private final UserRepository userRepository;
	private final DuelScenarioService scenarioService;
	private final DuelMarketService marketService;
	private final DuelResultRepository resultRepository;
	private final DuelRatingService ratingService;
	private final JsonMapper jsonMapper;
	private final Clock clock;
	private final DuelProperties properties;

	/** Future matchmaking entry point; no public arbitrary-opponent creation endpoint. */
	public UUID createMatch(Long firstUserId, Long secondUserId) {
		if (firstUserId == null || secondUserId == null || firstUserId.equals(secondUserId)) {
			throw new BadRequestException("A Duel requires two different learners");
		}
		// Every creation takes user locks in ascending order, irrespective of player seat.
		var lowerId = Math.min(firstUserId, secondUserId);
		var higherId = Math.max(firstUserId, secondUserId);
		var lower = lockUser(lowerId);
		var higher = lockUser(higherId);
		if (matchRepository.hasActiveMatch(lowerId, DuelPhase.ACTIVE_PHASES) || matchRepository.hasActiveMatch(higherId, DuelPhase.ACTIVE_PHASES)) {
			throw new DuelConflictException("A learner already has an active Duel");
		}
		// Both user rows are already locked in the global order; initialize accounts before a match can be evaluated.
		ratingService.getRating(lowerId);
		ratingService.getRating(higherId);
		var spec = scenarioService.generate();
		var now = clock.instant();
		var match = new DuelMatch();
		match.setId(UUID.randomUUID());
		match.setRatingFormulaVersion(DuelRatingService.FORMULA_VERSION);
		match.setScenarioJson(jsonMapper.writeValueAsString(spec));
		match.setMarketJson(jsonMapper.writeValueAsString(marketService.freeze(spec, now)));
		match.setCreatedAt(now);
		match.setPlanningStartsAt(now.plus(properties.briefingDuration()));
		match.setPlanningEndsAt(match.getPlanningStartsAt().plus(properties.planningDuration()));
		addParticipant(match, firstUserId.equals(lowerId) ? lower : higher, 1);
		addParticipant(match, secondUserId.equals(lowerId) ? lower : higher, 2);
		matchRepository.saveAndFlush(match);
		return match.getId();
	}

	/** Reads also reconcile deadlines, so this is deliberately a short write transaction. */
	public DuelMatchResponse getMatch(UUID matchId, Long learnerId) {
		var match = findOwnedLocked(matchId, learnerId);
		var now = clock.instant();
		advance(match, now);
		return snapshot(match, learnerId, now);
	}

	/** Separate release boundary: planning snapshots remain private even after evaluation. */
	public DuelResultResponse getResult(UUID matchId, Long learnerId) {
		var match = findOwnedLocked(matchId, learnerId);
		var now = clock.instant();
		advance(match, now);
		if (!RESULT_PHASES.contains(match.getPhase())) {
			throw new DuelConflictException("Duel results are not available in the current phase", snapshot(match, learnerId, now));
		}
		return readResult(matchId);
	}

	public DuelSettlementResponse getSettlement(UUID matchId, Long learnerId) {
		var match = findOwnedLocked(matchId, learnerId);
		var now = clock.instant();
		advance(match, now);
		if (match.getPhase() != DuelPhase.FINISHED) {
			throw new DuelConflictException("Duel ranking has not been settled yet", snapshot(match, learnerId, now));
		}
		return ratingService.readSettlementLocked(match, readResult(matchId));
	}

	private DuelResultResponse readResult(UUID matchId) {
		var result = resultRepository.findById(matchId)
				.orElseThrow(() -> new IllegalStateException("Evaluated Duel has no stored result"));
		return jsonMapper.readValue(result.getResultJson(), DuelResultResponse.class);
	}

	public DuelMatchResponse saveDraft(UUID matchId, Long learnerId, DuelPortfolioRequest request) {
		var match = findOwnedLocked(matchId, learnerId);
		var now = clock.instant();
		advance(match, now);
		var participant = participant(match, learnerId);
		requirePlanning(match, participant, learnerId, now);
		var spec = readSpec(match);
		var allocations = validate(match, participant, spec, request, learnerId, now);
		replaceDraft(match, participant, allocations, now);
		return snapshot(match, learnerId, now);
	}

	public DuelMatchResponse submit(UUID matchId, Long learnerId, DuelPortfolioRequest request) {
		var match = findOwnedLocked(matchId, learnerId);
		var now = clock.instant();
		advance(match, now);
		var participant = participant(match, learnerId);
		// A response lost in transit is safe to retry, even after another phase transition.
		if (participant.getSubmittedAt() != null) {
			return snapshot(match, learnerId, now);
		}
		requirePlanning(match, participant, learnerId, now);
		var allocations = validate(match, participant, readSpec(match), request, learnerId, now);
		if (allocations.isEmpty()) {
			throw new BadRequestException("Invest in at least one instrument before submitting");
		}
		replaceDraft(match, participant, allocations, now);
		participant.setSubmittedAt(now);
		participant.setSubmissionSource(DuelSubmissionSource.MANUAL);
		finishPlanning(match, now);
		return snapshot(match, learnerId, now);
	}

	/** Bounded selection; each selected match is subsequently rechecked under its own row lock. */
	@Transactional(readOnly = true)
	public List<UUID> findDueMatchIds() {
		return matchRepository.findDueIds(DuelPhase.BRIEFING, DuelPhase.PLANNING, DuelPhase.EVALUATED, DuelPhase.REPLAY,
				clock.instant(), PageRequest.of(0, 100));
	}

	public void advanceDueMatch(UUID matchId) {
		matchRepository.findLockedById(matchId).ifPresent(match -> advance(match, clock.instant()));
	}

	private User lockUser(Long id) {
		return userRepository.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
	}

	private static void addParticipant(DuelMatch match, User user, int seat) {
		var participant = new DuelParticipant();
		participant.setMatch(match);
		participant.setUser(user);
		participant.setSeat(seat);
		match.getParticipants().add(participant);
	}

	private DuelMatch findOwnedLocked(UUID matchId, Long learnerId) {
		if (matchId == null || learnerId == null) {
			throw new ResourceNotFoundException("Duel", matchId);
		}
		var match = matchRepository.findLockedById(matchId)
				.orElseThrow(() -> new ResourceNotFoundException("Duel", matchId));
		participant(match, learnerId); // authorize before any deadline transition or snapshot mapping
		return match;
	}

	private static DuelParticipant participant(DuelMatch match, Long learnerId) {
		return match.getParticipants().stream().filter(player -> player.getUser().getId().equals(learnerId))
				.findFirst().orElseThrow(() -> new ResourceNotFoundException("Duel", match.getId()));
	}

	private void advance(DuelMatch match, Instant now) {
		if (match.getPhase() == DuelPhase.BRIEFING && !now.isBefore(match.getPlanningStartsAt())) {
			match.setPhase(DuelPhase.PLANNING);
			changed(match);
		}
		if (match.getPhase() == DuelPhase.PLANNING && !now.isBefore(match.getPlanningEndsAt())) {
			for (var player : match.getParticipants()) {
				if (player.getSubmittedAt() == null) {
					// Use the logical deadline, not the possibly late scheduler invocation time.
					player.setSubmittedAt(match.getPlanningEndsAt());
					player.setSubmissionSource(DuelSubmissionSource.TIMEOUT);
				}
			}
			finishPlanning(match, now);
		}
		if (match.getPhase() == DuelPhase.EVALUATED && !now.isBefore(match.getReplayStartsAt())) {
			match.setPhase(DuelPhase.REPLAY);
			changed(match);
		}
		if (match.getPhase() == DuelPhase.REPLAY && !now.isBefore(match.getReplayEndsAt())) {
			ratingService.settleLocked(match, readResult(match.getId()), now);
		}
	}

	private static void finishPlanning(DuelMatch match, Instant now) {
		if (match.getPhase() != DuelPhase.PLANNING
				|| match.getParticipants().stream().anyMatch(player -> player.getSubmittedAt() == null)) {
			return;
		}
		if (match.getParticipants().stream().anyMatch(player -> player.getAllocations().isEmpty())) {
			match.setPhase(DuelPhase.CANCELLED);
			match.setCancellationReason(DuelCancellationReason.EMPTY_PORTFOLIO);
			match.setCancelledAt(now);
		} else {
			match.setPhase(DuelPhase.EVALUATING);
			match.setEvaluationStartedAt(now);
		}
		changed(match);
	}

	private void requirePlanning(DuelMatch match, DuelParticipant player, Long learnerId, Instant now) {
		if (match.getPhase() != DuelPhase.PLANNING || player.getSubmittedAt() != null) {
			throw new DuelConflictException("This portfolio is not editable in the current Duel phase", snapshot(match, learnerId, now));
		}
	}

	private Map<Long, BigDecimal> validate(DuelMatch match, DuelParticipant player, DuelScenarioSpec spec,
			DuelPortfolioRequest request, Long learnerId, Instant now) {
		if (request == null || request.expectedRevision() == null || request.expectedRevision() < 0 || request.allocations() == null) {
			throw new BadRequestException("Send expectedRevision and allocations; an empty list keeps the budget in cash");
		}
		if (request.expectedRevision() != player.getDraftRevision()) {
			throw new DuelConflictException("The portfolio changed; reload the accepted draft", snapshot(match, learnerId, now));
		}
		var allowed = spec.instruments().stream().map(DuelScenarioSpec.AllowedInstrument::id).collect(Collectors.toSet());
		if (request.allocations().size() > allowed.size()) {
			throw new BadRequestException("Too many allocations for this Duel's instrument whitelist");
		}
		var allocations = new LinkedHashMap<Long, BigDecimal>();
		var total = BigDecimal.ZERO;
		for (var allocation : request.allocations()) {
			if (allocation == null || allocation.instrumentId() == null || !allowed.contains(allocation.instrumentId())) {
				throw new BadRequestException("Each allocation must reference an instrument in this Duel's whitelist");
			}
			var amount = allocation.amount();
			if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 2 || amount.compareTo(spec.budget()) > 0) {
				throw new BadRequestException("Allocation amounts must be positive whole cents and no greater than the budget");
			}
			if (allocations.putIfAbsent(allocation.instrumentId(), amount.setScale(2)) != null) {
				throw new BadRequestException("An instrument may appear only once in the portfolio");
			}
			total = total.add(amount);
		}
		if (total.compareTo(spec.budget()) > 0) {
			throw new BadRequestException("Portfolio allocations exceed the Duel budget");
		}
		return allocations;
	}

	private static void replaceDraft(DuelMatch match, DuelParticipant player, Map<Long, BigDecimal> amounts, Instant now) {
		var existing = player.getAllocations().stream()
				.collect(Collectors.toMap(DuelAllocation::getInstrumentId, Function.identity()));
		// Reconcile in place: deleting/reinserting unchanged IDs can violate the unique key at flush.
		player.getAllocations().removeIf(allocation -> !amounts.containsKey(allocation.getInstrumentId()));
		amounts.forEach((id, amount) -> {
			var allocation = existing.get(id);
			if (allocation == null) {
				allocation = new DuelAllocation();
				allocation.setParticipant(player);
				allocation.setInstrumentId(id);
				player.getAllocations().add(allocation);
			}
			allocation.setAmount(amount);
		});
		player.setDraftRevision(player.getDraftRevision() + 1);
		player.setSavedAt(now);
		changed(match);
	}

	private DuelScenarioSpec readSpec(DuelMatch match) {
		return jsonMapper.readValue(match.getScenarioJson(), DuelScenarioSpec.class);
	}

	private DuelMatchResponse snapshot(DuelMatch match, Long learnerId, Instant now) {
		var spec = readSpec(match);
		var own = participant(match, learnerId);
		var allocations = own.getAllocations().stream().sorted(Comparator.comparing(DuelAllocation::getInstrumentId))
				.map(allocation -> new DuelMatchResponse.Allocation(allocation.getInstrumentId(), allocation.getAmount())).toList();
		var invested = allocations.stream().map(DuelMatchResponse.Allocation::amount).reduce(new BigDecimal("0.00"), BigDecimal::add);
		var portfolio = new DuelMatchResponse.Portfolio(own.getDraftRevision(), allocations, invested, spec.budget().subtract(invested),
				own.getSavedAt(), own.getSubmittedAt(), own.getSubmissionSource());
		var players = match.getParticipants().stream().sorted(Comparator.comparingInt(DuelParticipant::getSeat))
				.map(player -> new DuelMatchResponse.Player(player.getUser().getId(), player.getUser().getUsername(), player.getSeat(),
						player.getSubmittedAt() != null)).toList();
		return new DuelMatchResponse(match.getId(), match.getPhase(), match.getRevision(), DuelScenarioResponse.from(spec),
				match.getCreatedAt(), match.getPlanningStartsAt(), match.getPlanningEndsAt(), match.getEvaluationStartedAt(),
				match.getCancelledAt(), match.getCancellationReason(), match.getEvaluatedAt(), match.getFailedAt(),
				match.getFailureReason(), match.getReplayStartsAt(), match.getReplayEndsAt(), match.getFinishedAt(),
				match.getRatingFormulaVersion(), now, players, portfolio);
	}

	private static void changed(DuelMatch match) {
		match.setRevision(match.getRevision() + 1);
	}
}

package com.flexpol.backend.service;

import java.time.Clock;
import java.util.UUID;

import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelMeResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.exception.DuelConflictException;
import com.flexpol.backend.repository.DuelMatchRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/** Header-to-learner boundary. Request bodies never select the acting player. */
@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = DuelConflictException.class)
public class DuelApiService {

	private final UserService users;
	private final DuelMatchService matches;
	private final DuelRatingService ratings;
	private final DuelMatchRepository matchRepository;
	private final Clock clock;

	public DuelMeResponse getMe(String userEmail) {
		var userId = users.requireCurrentUser(userEmail).getId();
		var rating = ratings.getRating(userId);
		var one = PageRequest.of(0, 1);
		// No match locks/reconciliation after the profile's user-row lock. These are recovery hints only.
		var active = matchRepository.findActiveReferences(userId, DuelPhase.ACTIVE_PHASES, one).stream().findFirst().orElse(null);
		var terminal = matchRepository.findTerminalReferences(userId, DuelPhase.TERMINAL_PHASES, one).stream().findFirst().orElse(null);
		return new DuelMeResponse(rating, active, terminal, clock.instant());
	}

	// These reads can advance phases and settle ratings, so their transactions must not be read-only.
	public DuelMatchResponse getMatch(UUID matchId, String userEmail) {
		return matches.getMatch(matchId, users.requireCurrentUser(userEmail).getId());
	}

	public DuelMatchResponse saveDraft(UUID matchId, DuelPortfolioRequest request, String userEmail) {
		return matches.saveDraft(matchId, users.requireCurrentUser(userEmail).getId(), request);
	}

	public DuelMatchResponse submit(UUID matchId, DuelPortfolioRequest request, String userEmail) {
		return matches.submit(matchId, users.requireCurrentUser(userEmail).getId(), request);
	}

	public DuelResultResponse getResult(UUID matchId, String userEmail) {
		return matches.getResult(matchId, users.requireCurrentUser(userEmail).getId());
	}

	public DuelSettlementResponse getSettlement(UUID matchId, String userEmail) {
		return matches.getSettlement(matchId, users.requireCurrentUser(userEmail).getId());
	}
}

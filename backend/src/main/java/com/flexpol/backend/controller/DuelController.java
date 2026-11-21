package com.flexpol.backend.controller;

import java.util.UUID;

import com.flexpol.backend.dto.DuelMatchResponse;
import com.flexpol.backend.dto.DuelMeResponse;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.DuelResultResponse;
import com.flexpol.backend.dto.DuelSettlementResponse;
import com.flexpol.backend.service.DuelApiService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

/** Participant-only API; match creation is deliberately left to future matchmaking. */
@RestController
@RequestMapping("/api/duels")
@RequiredArgsConstructor
public class DuelController {

	private final DuelApiService duels;

	@GetMapping("/me")
	public DuelMeResponse me(@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.getMe(userEmail);
	}

	@GetMapping("/{matchId}")
	public DuelMatchResponse get(@PathVariable UUID matchId,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.getMatch(matchId, userEmail);
	}

	@PutMapping("/{matchId}/draft")
	public DuelMatchResponse saveDraft(@PathVariable UUID matchId, @RequestBody DuelPortfolioRequest request,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.saveDraft(matchId, request, userEmail);
	}

	@PostMapping("/{matchId}/submit")
	public DuelMatchResponse submit(@PathVariable UUID matchId, @RequestBody DuelPortfolioRequest request,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.submit(matchId, request, userEmail);
	}

	@GetMapping("/{matchId}/result")
	public DuelResultResponse result(@PathVariable UUID matchId,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.getResult(matchId, userEmail);
	}

	@GetMapping("/{matchId}/settlement")
	public DuelSettlementResponse settlement(@PathVariable UUID matchId,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return duels.getSettlement(matchId, userEmail);
	}
}

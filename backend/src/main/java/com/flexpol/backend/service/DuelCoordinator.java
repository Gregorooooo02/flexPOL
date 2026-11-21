package com.flexpol.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/** One bounded scan, with a separate short transaction per match. No browser callback is needed. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "hedgeflex.duel", name = "coordinator-enabled", havingValue = "true", matchIfMissing = true)
public class DuelCoordinator {

	private static final Logger LOG = LoggerFactory.getLogger(DuelCoordinator.class);
	private final DuelMatchService matchService;
	private final DuelEvaluationWorker evaluationWorker;

	@Scheduled(fixedDelayString = "${hedgeflex.duel.coordinator-delay:500ms}")
	public void advanceDueMatches() {
		for (var matchId : matchService.findDueMatchIds()) {
			try {
				matchService.advanceDueMatch(matchId);
			} catch (RuntimeException error) {
				LOG.warn("Could not advance Duel {}", matchId, error);
			}
		}
		evaluationWorker.dispatchPending();
	}
}

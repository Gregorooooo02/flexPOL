package com.flexpol.backend.service;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

/** Bounded in-process delivery; durable job authority and recovery live in the match table. */
@Service
public class DuelEvaluationWorker {

	private static final Logger LOG = LoggerFactory.getLogger(DuelEvaluationWorker.class);
	private final DuelEvaluationJobService jobs;
	private final DuelEvaluationService evaluator;
	private final ThreadPoolTaskExecutor executor;
	private final Set<UUID> inFlight = ConcurrentHashMap.newKeySet();

	public DuelEvaluationWorker(DuelEvaluationJobService jobs, DuelEvaluationService evaluator,
			@Qualifier("duelEvaluationExecutor") ThreadPoolTaskExecutor executor) {
		this.jobs = jobs;
		this.evaluator = evaluator;
		this.executor = executor;
	}

	public void dispatchPending() {
		for (var matchId : jobs.findPendingIds()) {
			if (!inFlight.add(matchId)) continue;
			try {
				executor.execute(() -> {
					try {
						evaluateMatch(matchId);
					} catch (RuntimeException error) {
						LOG.warn("Duel evaluation delivery failed for {} ({})", matchId, error.getClass().getSimpleName());
					} finally {
						inFlight.remove(matchId);
					}
				});
			} catch (TaskRejectedException busy) {
				inFlight.remove(matchId);
				break; // no unbounded executor queue or premature claim; next scan can deliver it
			}
		}
	}

	/** Also usable synchronously by service tests; never invoked inside a database transaction. */
	public void evaluateMatch(UUID matchId) {
		var claim = jobs.claim(matchId);
		if (claim.isEmpty()) return;
		var work = claim.get();
		try {
			jobs.complete(work, evaluator.evaluate(work));
		} catch (RuntimeException error) {
			jobs.fail(work);
			LOG.warn("Duel evaluation failed for {} ({})", matchId, error.getClass().getSimpleName());
		}
	}
}

package com.flexpol.backend.service;

import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "hedgeflex.duel", name = "coordinator-enabled", havingValue = "true", matchIfMissing = true)
public class DuelMatchmakingWorker {
	private final DuelQueueService queue;
	private final DuelRealtimeService realtime;
	private final ThreadPoolTaskExecutor executor;
	private final AtomicBoolean running = new AtomicBoolean();

	public DuelMatchmakingWorker(DuelQueueService queue, DuelRealtimeService realtime,
			@Qualifier("duelMatchmakingExecutor") ThreadPoolTaskExecutor executor) {
		this.queue = queue; this.realtime = realtime; this.executor = executor;
	}

	@Scheduled(fixedDelayString = "${hedgeflex.duel.matchmaking-delay:500ms}")
	public void tick() {
		realtime.cleanup();
		if (!running.compareAndSet(false, true)) return;
		try {
			executor.execute(() -> {
				try { queue.prune(); for (int i = 0; i < 8 && queue.matchNext(); i++) { /* bounded batch */ } }
				finally { running.set(false); }
			});
		} catch (TaskRejectedException busy) { running.set(false); }
	}
}

package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import com.flexpol.backend.config.DuelMatchmakingProperties;
import com.flexpol.backend.dto.DuelQueueResponse.State;
import com.flexpol.backend.exception.DuelQueueConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DuelQueueServiceTests {
	private DuelQueueDirectory directory;
	private DuelQueueService queue;
	private DuelMatchServiceTests.MutableClock clock;
	private final ConcurrentHashMap<Long, UUID> active = new ConcurrentHashMap<>();

	@BeforeEach
	void setup() {
		directory = mock(DuelQueueDirectory.class);
		clock = new DuelMatchServiceTests.MutableClock(new AtomicReference<>(Instant.parse("2026-11-21T12:00:00Z")), ZoneOffset.UTC);
		queue = new DuelQueueService(directory, mock(DuelRealtimeService.class), properties(), clock);
		when(directory.status(anyLong())).thenAnswer(call -> new DuelQueueDirectory.Status(true, active.get(call.getArgument(0))));
		when(directory.create(anyLong(), anyLong())).thenAnswer(call -> paired(call.getArgument(0), call.getArgument(1)));
	}

	@Test
	void fifoJoinIsIdempotentAndAnActiveMatchIsRecoveredInsteadOfRequeued() {
		var first = queue.join(1L);
		assertThat(queue.join(1L)).isEqualTo(first);
		assertThat(queue.matchNext()).isFalse();
		queue.join(2L);
		queue.join(3L);
		assertThat(queue.matchNext()).isTrue();
		assertThat(queue.status(1L).state()).isEqualTo(State.MATCHED);
		assertThat(queue.status(1L).matchId()).isEqualTo(queue.status(2L).matchId());
		assertThat(queue.join(1L).matchId()).isEqualTo(active.get(1L));
		assertThat(queue.status(3L).state()).isEqualTo(State.WAITING);
		verify(directory, times(1)).create(1L, 2L);
	}

	@Test
	void exactLeaseExpiryAndStaleCommandsCannotRenewOrDeleteANewerEntry() {
		var old = queue.join(1L);
		clock.set(old.leaseExpiresAt());
		assertThatThrownBy(() -> queue.heartbeat(1L, old.entryId())).isInstanceOf(DuelQueueConflictException.class);
		var next = queue.join(1L);
		assertThat(next.entryId()).isNotEqualTo(old.entryId());
		assertThatThrownBy(() -> queue.leave(1L, old.entryId())).isInstanceOf(DuelQueueConflictException.class);
		assertThatThrownBy(() -> queue.heartbeat(1L, old.entryId())).isInstanceOf(DuelQueueConflictException.class);
		clock.set(clock.instant().plusSeconds(5));
		assertThat(queue.heartbeat(1L, next.entryId()).leaseExpiresAt()).isAfter(next.leaseExpiresAt());
		assertThat(queue.leave(1L, next.entryId()).state()).isEqualTo(State.IDLE);
		assertThat(queue.leave(1L, next.entryId()).state()).isEqualTo(State.IDLE);
		var delayed = queue.join(2L);
		clock.set(delayed.leaseExpiresAt().minusNanos(1));
		doAnswer(call -> {
			clock.set(delayed.leaseExpiresAt());
			return new DuelQueueDirectory.Status(true, null);
		}).when(directory).status(2L);
		assertThatThrownBy(() -> queue.heartbeat(2L, delayed.entryId())).isInstanceOf(DuelQueueConflictException.class);
	}

	@Test
	void leavingDuringFailedCreationDoesNotBlockCommandsOrLoseThePartnersFifoPriority() throws Exception {
		var first = queue.join(1L);
		queue.join(2L);
		queue.join(3L);
		var entered = new CountDownLatch(1);
		var release = new CountDownLatch(1);
		var attempts = new AtomicInteger();
		when(directory.create(anyLong(), anyLong())).thenAnswer(call -> {
			if (attempts.getAndIncrement() == 0) {
				entered.countDown();
				if (!release.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("test gate timed out");
				throw new IllegalStateException("database creation rolled back");
			}
			return paired(call.getArgument(0), call.getArgument(1));
		});
		try (var pool = Executors.newSingleThreadExecutor()) {
			var pairing = pool.submit(queue::matchNext);
			try {
				assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
				assertThat(queue.leave(1L, first.entryId()).state()).isEqualTo(State.MATCHING);
				assertThat(queue.join(1L).state()).isEqualTo(State.MATCHING);
				assertThat(queue.matchNext()).isFalse();
			} finally { release.countDown(); }
			assertThat(pairing.get(10, TimeUnit.SECONDS)).isFalse();
		}
		assertThat(queue.status(1L).state()).isEqualTo(State.IDLE);
		clock.set(clock.instant().plusSeconds(2));
		assertThat(queue.matchNext()).isTrue();
		verify(directory).create(2L, 3L);
	}

	@Test
	void uncertainCommitIsRecoveredFromTheDatabaseRatherThanCreatingAnotherGame() {
		queue.join(1L); queue.join(2L);
		when(directory.create(1L, 2L)).thenAnswer(call -> {
			paired(1L, 2L);
			throw new IllegalStateException("lost creation acknowledgement");
		});
		assertThat(queue.matchNext()).isFalse();
		assertThat(queue.status(1L).state()).isEqualTo(State.MATCHED);
		assertThat(queue.status(2L).matchId()).isEqualTo(active.get(1L));
		clock.set(clock.instant().plusSeconds(2));
		assertThat(queue.matchNext()).isFalse();
		verify(directory, times(1)).create(1L, 2L);
	}

	private UUID paired(Long first, Long second) {
		var id = UUID.randomUUID(); active.put(first, id); active.put(second, id); return id;
	}

	static DuelMatchmakingProperties properties() {
		return new DuelMatchmakingProperties(Duration.ofSeconds(30), Duration.ofSeconds(10), Duration.ofSeconds(30), List.of("http://localhost:5173"));
	}
}

package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import com.flexpol.backend.dto.DuelNotification;
import com.flexpol.backend.exception.DuelCapacityException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class DuelRealtimeServiceTests {
	private DuelRealtimeService realtime;
	private DuelMatchServiceTests.MutableClock clock;

	@BeforeEach
	void setup() {
		clock = new DuelMatchServiceTests.MutableClock(new AtomicReference<>(Instant.parse("2026-11-21T12:00:00Z")), ZoneOffset.UTC);
		realtime = new DuelRealtimeService(clock, DuelQueueServiceTests.properties(), JsonMapper.builder().build());
	}

	@Test
	void ticketsAreOneUseExpiringAndBoundToCappedRecipientConnections() {
		var ticket = realtime.issueTicket(1L);
		var grant = realtime.consumeTicket(ticket.ticket()).orElseThrow();
		assertThat(realtime.consumeTicket(ticket.ticket())).isEmpty();
		var first = new Peer(true);
		assertThat(realtime.attach(grant, first)).isTrue();
		assertThat(realtime.attach(grant, new Peer(true))).isFalse();
		var other = attach(2L, true);
		realtime.notifyUser(1L, notification());
		assertThat(first.messages).hasSize(1);
		assertThat(other.messages).isEmpty();
		for (int i = 0; i < 4; i++) attach(1L, true);
		assertThatThrownBy(() -> realtime.issueTicket(1L)).isInstanceOf(DuelCapacityException.class);
		realtime.disconnect(first.id());
		assertThat(first.closed).isTrue();
		var expired = realtime.issueTicket(1L);
		clock.set(expired.expiresAt());
		assertThat(realtime.consumeTicket(expired.ticket())).isEmpty();
		clock.set(clock.instant().plusSeconds(30));
		realtime.cleanup();
		assertThat(other.closed).isTrue();
		assertThat(realtime.consumeTicket(realtime.issueTicket(1L).ticket())).isPresent();
	}

	@Test
	void aSlowPeerIsBoundedByBufferAndSendDeadlineWithoutBlockingAnotherRecipient() {
		var slow = attach(1L, false);
		var healthy = attach(2L, true);
		for (int i = 0; i < 33; i++) realtime.notifyUser(1L, notification());
		assertThat(slow.messages).hasSize(1);
		assertThat(slow.closed).isTrue();
		realtime.notifyUser(2L, notification());
		assertThat(healthy.messages).hasSize(1);
		var stalled = attach(3L, false);
		realtime.notifyUser(3L, notification());
		clock.set(clock.instant().plusSeconds(5));
		realtime.cleanup();
		assertThat(stalled.closed).isTrue();
		assertThat(healthy.closed).isFalse();
	}

	private Peer attach(Long userId, boolean acknowledge) {
		var peer = new Peer(acknowledge);
		assertThat(realtime.attach(realtime.consumeTicket(realtime.issueTicket(userId).ticket()).orElseThrow(), peer)).isTrue();
		return peer;
	}

	private DuelNotification notification() {
		return new DuelNotification(DuelNotification.Type.MATCH_CHANGED, UUID.randomUUID(), 1L, null, clock.instant());
	}

	static class Peer implements DuelRealtimeService.Peer {
		final String id = UUID.randomUUID().toString();
		final ArrayList<String> messages = new ArrayList<>();
		final boolean acknowledge;
		boolean closed;
		Peer(boolean acknowledge) { this.acknowledge = acknowledge; }
		public String id() { return id; }
		public void send(String text, Consumer<Boolean> completion) { messages.add(text); if (acknowledge) completion.accept(true); }
		public void close() { closed = true; }
	}
}

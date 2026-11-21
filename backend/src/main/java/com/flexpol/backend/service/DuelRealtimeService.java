package com.flexpol.backend.service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import com.flexpol.backend.config.DuelMatchmakingProperties;
import com.flexpol.backend.dto.DuelNotification;
import com.flexpol.backend.dto.DuelRealtimeTicketResponse;
import com.flexpol.backend.exception.DuelCapacityException;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;

/** Bounded, recipient-scoped delivery. Peers must implement non-blocking send/close. */
@Service
@RequiredArgsConstructor
public class DuelRealtimeService {
	private static final SecureRandom RANDOM = new SecureRandom();
	private static final int PER_USER_LIMIT = 5;
	private static final int CONNECTION_LIMIT = 1000;
	private static final int TICKET_LIMIT = 4096;
	private final Clock clock;
	private final DuelMatchmakingProperties properties;
	private final JsonMapper jsonMapper;
	private final Object mutex = new Object();
	private final Map<String, Ticket> tickets = new HashMap<>();
	private final Map<UUID, Grant> pending = new HashMap<>();
	private final Map<String, Connection> connections = new HashMap<>();

	public interface Peer {
		String id();
		void send(String text, Consumer<Boolean> completion);
		void close();
	}
	public record Grant(Long userId, UUID permit, Instant expiresAt) { }
	private record Ticket(Long userId, Instant expiresAt) { }

	public DuelRealtimeTicketResponse issueTicket(Long userId) {
		var now = clock.instant();
		synchronized (mutex) {
			expireCredentials(now);
			if (tickets.size() >= TICKET_LIMIT || tickets.values().stream().filter(ticket -> ticket.userId().equals(userId)).count() >= PER_USER_LIMIT
					|| occupied(userId) >= PER_USER_LIMIT) throw new DuelCapacityException("Too many Duel realtime credentials/connections");
			byte[] bytes = new byte[24];
			RANDOM.nextBytes(bytes);
			var token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
			var expires = now.plus(properties.ticketLease());
			tickets.put(token, new Ticket(userId, expires));
			return new DuelRealtimeTicketResponse(token, expires, "duels/ws");
		}
	}

	/** One-use credential consumption reserves a slot through handshake completion. */
	public Optional<Grant> consumeTicket(String token) {
		synchronized (mutex) {
			var now = clock.instant();
			expireCredentials(now);
			var ticket = tickets.remove(token);
			if (ticket == null || occupied(ticket.userId()) >= PER_USER_LIMIT || connections.size() + pending.size() >= CONNECTION_LIMIT) return Optional.empty();
			var grant = new Grant(ticket.userId(), UUID.randomUUID(), now.plus(properties.ticketLease()));
			pending.put(grant.permit(), grant);
			return Optional.of(grant);
		}
	}

	public boolean attach(Grant grant, Peer peer) {
		synchronized (mutex) {
			expireCredentials(clock.instant());
			if (!grant.equals(pending.remove(grant.permit())) || connections.containsKey(peer.id())) return false;
			connections.put(peer.id(), new Connection(grant.userId(), peer, clock.instant()));
			return true;
		}
	}

	public void release(Grant grant) {
		synchronized (mutex) { pending.remove(grant.permit(), grant); }
	}

	public void notifyUser(Long userId, DuelNotification notification) {
		List<Connection> recipients;
		synchronized (mutex) { recipients = connections.values().stream().filter(connection -> connection.userId.equals(userId)).toList(); }
		var text = jsonMapper.writeValueAsString(notification);
		for (var connection : recipients) enqueue(connection, text);
	}

	public void ping(String peerId) {
		Connection connection;
		synchronized (mutex) { connection = connections.get(peerId); }
		if (connection == null) return;
		synchronized (connection) { connection.lastSeen = clock.instant(); }
		enqueue(connection, jsonMapper.writeValueAsString(new DuelNotification(DuelNotification.Type.PONG, null, null, null, clock.instant())));
	}

	public void disconnect(String peerId) {
		Connection connection;
		synchronized (mutex) { connection = connections.remove(peerId); }
		if (connection == null) return;
		synchronized (connection) { connection.closed = true; connection.messages.clear(); }
		try { connection.peer.close(); } catch (RuntimeException ignored) { /* peer is already deregistered */ }
	}

	public void cleanup() {
		List<Connection> peers;
		var now = clock.instant();
		synchronized (mutex) { expireCredentials(now); peers = List.copyOf(connections.values()); }
		for (var peer : peers) {
			boolean expired;
			synchronized (peer) {
				expired = !now.isBefore(peer.lastSeen.plusSeconds(60))
						|| (peer.sendingSince != null && !now.isBefore(peer.sendingSince.plus(Duration.ofSeconds(5))));
			}
			if (expired) disconnect(peer.peer.id());
		}
	}

	private void enqueue(Connection connection, String text) {
		boolean overflow;
		synchronized (connection) {
			if (connection.closed) return;
			overflow = connection.messages.size() + (connection.sendingSince == null ? 0 : 1) >= 32;
			if (!overflow) connection.messages.add(text);
		}
		if (overflow) disconnect(connection.peer.id());
		else sendNext(connection);
	}

	private void sendNext(Connection connection) {
		String message;
		synchronized (connection) {
			if (connection.closed || connection.sendingSince != null || connection.messages.isEmpty()) return;
			message = connection.messages.remove();
			connection.sendingSince = clock.instant();
		}
		try {
			connection.peer.send(message, success -> {
				if (!success) { disconnect(connection.peer.id()); return; }
				synchronized (connection) { connection.sendingSince = null; }
				sendNext(connection);
			});
		} catch (RuntimeException failed) { disconnect(connection.peer.id()); }
	}

	private long occupied(Long userId) {
		return connections.values().stream().filter(connection -> connection.userId.equals(userId)).count()
				+ pending.values().stream().filter(grant -> grant.userId().equals(userId)).count();
	}

	private void expireCredentials(Instant now) {
		tickets.values().removeIf(ticket -> !now.isBefore(ticket.expiresAt()));
		pending.values().removeIf(grant -> !now.isBefore(grant.expiresAt()));
	}

	private static final class Connection {
		final Long userId;
		final Peer peer;
		final ArrayDeque<String> messages = new ArrayDeque<>();
		Instant lastSeen;
		Instant sendingSince;
		boolean closed;
		Connection(Long userId, Peer peer, Instant now) { this.userId = userId; this.peer = peer; this.lastSeen = now; }
	}
}

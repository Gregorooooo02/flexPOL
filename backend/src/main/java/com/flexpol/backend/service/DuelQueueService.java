package com.flexpol.backend.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import com.flexpol.backend.config.DuelMatchmakingProperties;
import com.flexpol.backend.dto.DuelNotification;
import com.flexpol.backend.dto.DuelQueueResponse;
import com.flexpol.backend.dto.DuelQueueResponse.State;
import com.flexpol.backend.exception.DuelCapacityException;
import com.flexpol.backend.exception.DuelQueueConflictException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/** Single-instance FIFO. Reserved entries stay in place until their database outcome is known. */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class DuelQueueService {
	private final DuelQueueDirectory directory;
	private final DuelRealtimeService realtime;
	private final DuelMatchmakingProperties properties;
	private final Clock clock;
	private final Object mutex = new Object();
	private final Map<Long, Entry> entries = new LinkedHashMap<>();
	private final AtomicBoolean pumping = new AtomicBoolean();
	private Pair unresolved;
	private Instant retryAfter = Instant.MIN;

	public DuelQueueResponse status(Long userId) {
		prune();
		Entry observed;
		UUID oldMatch;
		synchronized (mutex) { observed = entries.get(userId); oldMatch = observed == null ? null : observed.matchId; }
		var persisted = directory.status(userId);
		synchronized (mutex) {
			var current = entries.get(userId);
			// A delayed read may not mutate a newer generation.
			if (current != observed) return view(current, null);
			if (current != null && current.reservation == null && !clock.instant().isBefore(current.expiresAt)) {
				entries.remove(userId);
				current = null;
			}
			if (persisted.matchId() != null) {
				if (current != null) markMatched(current, persisted.matchId());
				return view(current, persisted.matchId());
			}
			if (current != null && current.matchId != null && Objects.equals(oldMatch, current.matchId)) {
				entries.remove(userId); // this already-known game is now terminal
				current = null;
			}
			return view(current, null);
		}
	}

	public DuelQueueResponse join(Long userId) {
		var existing = status(userId);
		if (existing.state() != State.IDLE) return existing;
		Entry entry;
		synchronized (mutex) {
			entry = entries.get(userId);
			if (entry == null) {
				if (entries.size() >= 1000) throw new DuelCapacityException("The Duel queue is full; try again shortly");
				entry = new Entry(userId, clock.instant(), properties.queueLease());
				entries.put(userId, entry);
			}
		}
		try {
			var persisted = directory.status(userId);
			synchronized (mutex) {
				if (entries.get(userId) == entry && entry.checking) {
					if (persisted.matchId() != null) markMatched(entry, persisted.matchId());
					else if (entry.leaveRequested || !persisted.exists()) entries.remove(userId);
					else entry.checking = false;
				}
			}
		} catch (RuntimeException error) {
			synchronized (mutex) { if (entry.checking) entries.remove(userId, entry); }
			throw error;
		}
		changed(userId, entry.id);
		return status(userId);
	}

	public DuelQueueResponse leave(Long userId, UUID entryId) {
		var current = status(userId);
		if (current.state() == State.MATCHED || current.state() == State.IDLE) return current;
		DuelQueueResponse response;
		synchronized (mutex) {
			var entry = requireEntry(userId, entryId);
			if (entry.matchId != null) return view(entry, null); // creation may have committed since status() returned
			if (entry.reservation != null || entry.checking) entry.leaveRequested = true;
			else entries.remove(userId);
			response = view(entries.get(userId), null);
		}
		changed(userId, entryId);
		return response;
	}

	public DuelQueueResponse heartbeat(Long userId, UUID entryId) {
		var current = status(userId);
		if (current.state() == State.MATCHED) return current;
		synchronized (mutex) {
			var entry = requireEntry(userId, entryId);
			entry.expiresAt = clock.instant().plus(properties.queueLease());
			return view(entry, null);
		}
	}

	/** One pair per call; guarded independently of queue membership commands and their HTTP threads. */
	public boolean matchNext() {
		if (!pumping.compareAndSet(false, true)) return false;
		try {
			if (clock.instant().isBefore(retryAfter)) return false;
			if (unresolved != null) { recover(unresolved); return false; }
			prune();
			Pair pair;
			synchronized (mutex) {
				var now = clock.instant();
				var waiting = entries.values().stream().filter(entry -> !entry.checking && entry.reservation == null
						&& entry.matchId == null && !entry.leaveRequested && now.isBefore(entry.expiresAt)).limit(2).toList();
				if (waiting.size() < 2) return false;
				var token = UUID.randomUUID();
				pair = new Pair(waiting.getFirst(), waiting.getLast(), token);
				pair.first.reservation = token;
				pair.second.reservation = token;
				unresolved = pair;
			}
			changed(pair.first.userId, pair.first.id);
			changed(pair.second.userId, pair.second.id);
			try {
				var matchId = directory.create(pair.first.userId, pair.second.userId);
				complete(pair, new DuelQueueDirectory.Status(true, matchId), new DuelQueueDirectory.Status(true, matchId));
				return true;
			} catch (RuntimeException creationFailed) {
				// The transactional proxy has returned; check persisted participation before requeueing.
				recover(pair);
				return false;
			}
		} finally { pumping.set(false); }
	}

	public void prune() {
		var removed = new ArrayList<Entry>();
		var now = clock.instant();
		synchronized (mutex) {
			entries.values().removeIf(entry -> {
				boolean expired = entry.reservation == null && !now.isBefore(entry.expiresAt);
				if (expired) removed.add(entry);
				return expired;
			});
		}
		for (var entry : removed) changed(entry.userId, entry.id);
	}

	private void recover(Pair pair) {
		retryAfter = clock.instant().plusSeconds(2);
		try { complete(pair, directory.status(pair.first.userId), directory.status(pair.second.userId)); }
		catch (RuntimeException unavailable) { /* retain reservations until an authoritative read succeeds */ }
	}

	private void complete(Pair pair, DuelQueueDirectory.Status first, DuelQueueDirectory.Status second) {
		synchronized (mutex) {
			finishEntry(pair.first, pair.token, first);
			finishEntry(pair.second, pair.token, second);
			unresolved = null;
		}
		changed(pair.first.userId, pair.first.id);
		changed(pair.second.userId, pair.second.id);
	}

	private void finishEntry(Entry entry, UUID token, DuelQueueDirectory.Status status) {
		if (entries.get(entry.userId) != entry || !token.equals(entry.reservation)) return;
		entry.reservation = null;
		if (status.matchId() != null) markMatched(entry, status.matchId());
		else if (!status.exists() || entry.leaveRequested || !clock.instant().isBefore(entry.expiresAt)) entries.remove(entry.userId);
	}

	private void markMatched(Entry entry, UUID matchId) {
		if (!matchId.equals(entry.matchId)) entry.expiresAt = clock.instant().plus(properties.queueLease());
		entry.matchId = matchId;
		entry.checking = false;
	}

	private Entry requireEntry(Long userId, UUID id) {
		var entry = entries.get(userId);
		if (entry != null && entry.reservation == null && !clock.instant().isBefore(entry.expiresAt)) {
			entries.remove(userId);
			entry = null;
		}
		if (id == null || entry == null || !entry.id.equals(id)) throw new DuelQueueConflictException("Queue entry changed or expired; reload the queue status");
		return entry;
	}

	private DuelQueueResponse view(Entry entry, UUID persisted) {
		var matchId = persisted != null ? persisted : entry == null ? null : entry.matchId;
		var state = matchId != null ? State.MATCHED : entry == null ? State.IDLE
				: entry.checking || entry.reservation != null ? State.MATCHING : State.WAITING;
		return new DuelQueueResponse(state, entry == null ? null : entry.id, entry == null ? null : entry.joinedAt,
				entry == null ? null : entry.expiresAt, matchId, properties.heartbeatInterval().toMillis(), clock.instant());
	}

	private void changed(Long userId, UUID entryId) {
		realtime.notifyUser(userId, new DuelNotification(DuelNotification.Type.QUEUE_CHANGED, null, null, entryId, clock.instant()));
	}

	private record Pair(Entry first, Entry second, UUID token) { }
	private static final class Entry {
		final Long userId;
		final UUID id = UUID.randomUUID();
		final Instant joinedAt;
		Instant expiresAt;
		boolean checking = true;
		boolean leaveRequested;
		UUID reservation;
		UUID matchId;
		Entry(Long userId, Instant now, java.time.Duration lease) { this.userId = userId; this.joinedAt = now; this.expiresAt = now.plus(lease); }
	}
}

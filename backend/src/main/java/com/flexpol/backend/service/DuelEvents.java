package com.flexpol.backend.service;

import java.time.Clock;
import java.util.Set;
import java.util.UUID;

import com.flexpol.backend.dto.DuelNotification;
import com.flexpol.backend.entity.DuelMatch;
import com.flexpol.backend.entity.DuelPhase;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import lombok.RequiredArgsConstructor;

/** Immutable event data only; all transport work happens after commit and outside domain locks. */
@Service
@RequiredArgsConstructor
public class DuelEvents {
	private final ApplicationEventPublisher publisher;
	private final DuelRealtimeService realtime;
	private final Clock clock;

	public record Committed(Set<Long> recipients, DuelNotification notification) {
		public Committed { recipients = Set.copyOf(recipients); }
	}

	public void match(DuelMatch match, Set<Long> recipients, boolean created) {
		publisher.publishEvent(new Committed(recipients, new DuelNotification(created ? DuelNotification.Type.MATCH_FOUND
				: DuelNotification.Type.MATCH_CHANGED, match.getId(), match.getRevision(), null, clock.instant())));
		if (match.getPhase() == DuelPhase.FINISHED) publisher.publishEvent(new Committed(recipients,
				new DuelNotification(DuelNotification.Type.RATING_CHANGED, match.getId(), match.getRevision(), null, clock.instant())));
	}

	@TransactionalEventListener
	public void deliver(Committed event) {
		// Notification delivery is best effort; a peer failure cannot invalidate a committed game.
		for (var userId : event.recipients()) {
			try { realtime.notifyUser(userId, event.notification()); }
			catch (RuntimeException ignored) { /* clients recover through canonical reads */ }
		}
	}

	public static Set<Long> participants(DuelMatch match) {
		return match.getParticipants().stream().map(player -> player.getUser().getId()).collect(java.util.stream.Collectors.toUnmodifiableSet());
	}
}

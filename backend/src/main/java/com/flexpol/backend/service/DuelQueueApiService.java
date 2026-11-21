package com.flexpol.backend.service;

import java.util.UUID;
import com.flexpol.backend.dto.DuelQueueResponse;
import com.flexpol.backend.dto.DuelRealtimeTicketResponse;
import com.flexpol.backend.exception.BadRequestException;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

/** Intentionally no outer transaction: directory calls commit before memory/transport operations. */
@Service
@RequiredArgsConstructor
public class DuelQueueApiService {
	private final DuelQueueDirectory directory;
	private final DuelQueueService queue;
	private final DuelRealtimeService realtime;
	public DuelQueueResponse status(String email) { return queue.status(directory.resolve(email)); }
	public DuelQueueResponse join(String email) { return queue.join(directory.resolve(email)); }
	public DuelQueueResponse leave(String email, UUID entryId) { return queue.leave(directory.resolve(email), entryId); }
	public DuelQueueResponse heartbeat(String email, UUID entryId) {
		var userId = directory.resolve(email);
		if (entryId == null) throw new BadRequestException("entryId is required");
		return queue.heartbeat(userId, entryId);
	}
	public DuelRealtimeTicketResponse ticket(String email) { return realtime.issueTicket(directory.resolve(email)); }
}

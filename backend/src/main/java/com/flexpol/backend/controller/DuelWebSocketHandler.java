package com.flexpol.backend.controller;

import com.flexpol.backend.service.DuelRealtimeService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.adapter.standard.StandardWebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/** Native container async sends avoid blocking transaction/event threads on a slow client. */
@Component
public class DuelWebSocketHandler extends TextWebSocketHandler {
	private final DuelRealtimeService realtime;
	private final ThreadPoolTaskExecutor closer;

	public DuelWebSocketHandler(DuelRealtimeService realtime, @Qualifier("duelSocketCloseExecutor") ThreadPoolTaskExecutor closer) {
		this.realtime = realtime; this.closer = closer;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		var grant = (DuelRealtimeService.Grant) session.getAttributes().get(DuelHandshakeInterceptor.GRANT);
		if (!(session instanceof StandardWebSocketSession standard) || grant == null) {
			session.close(CloseStatus.POLICY_VIOLATION); return;
		}
		var nativeSession = standard.getNativeSession();
		nativeSession.setMaxIdleTimeout(60_000);
		nativeSession.setMaxTextMessageBufferSize(64);
		nativeSession.getAsyncRemote().setSendTimeout(5_000);
		var peer = new DuelRealtimeService.Peer() {
			public String id() { return session.getId(); }
			public void send(String text, java.util.function.Consumer<Boolean> completion) {
				nativeSession.getAsyncRemote().sendText(text, result -> completion.accept(result.isOK()));
			}
			public void close() {
				try {
					closer.execute(() -> { try { nativeSession.close(); } catch (Exception ignored) { } });
				} catch (TaskRejectedException busy) { /* native idle/send timeout is the final physical-close bound */ }
			}
		};
		if (!realtime.attach(grant, peer)) { realtime.release(grant); peer.close(); }
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) {
		if ("ping".equals(message.getPayload())) realtime.ping(session.getId());
		else realtime.disconnect(session.getId()); // notification-only, never accept portfolio/subscription commands
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { realtime.disconnect(session.getId()); }

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) { realtime.disconnect(session.getId()); }
}

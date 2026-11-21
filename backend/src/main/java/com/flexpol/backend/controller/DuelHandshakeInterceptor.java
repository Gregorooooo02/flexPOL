package com.flexpol.backend.controller;

import java.util.Map;
import com.flexpol.backend.config.DuelMatchmakingProperties;
import com.flexpol.backend.config.DuelTicketRedactionFilter;
import com.flexpol.backend.service.DuelRealtimeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DuelHandshakeInterceptor implements HandshakeInterceptor {
	public static final String GRANT = "duelGrant";
	private final DuelRealtimeService realtime;
	private final DuelMatchmakingProperties properties;

	@Override
	public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler, Map<String, Object> attributes) {
		response.getHeaders().setCacheControl("no-store");
		if (!properties.allowedOrigins().contains(request.getHeaders().getOrigin())) {
			response.setStatusCode(HttpStatus.FORBIDDEN); return false;
		}
		var token = request instanceof ServletServerHttpRequest servlet
				? (String) servlet.getServletRequest().getAttribute(DuelTicketRedactionFilter.CREDENTIAL) : null;
		var grant = token == null ? java.util.Optional.<DuelRealtimeService.Grant>empty() : realtime.consumeTicket(token);
		if (grant.isEmpty()) { response.setStatusCode(HttpStatus.UNAUTHORIZED); return false; }
		attributes.put(GRANT, grant.get());
		return true;
	}

	@Override
	public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler, Exception exception) {
		// Unattached permits expire automatically, including unsuccessful upgrades after credential consumption.
	}
}

package com.flexpol.backend.config;

import com.flexpol.backend.controller.DuelHandshakeInterceptor;
import com.flexpol.backend.controller.DuelWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.ServletWebSocketHandlerRegistry;
import lombok.RequiredArgsConstructor;

@Configuration(proxyBeanMethods = false)
@EnableWebSocket
@RequiredArgsConstructor
public class DuelWebSocketConfiguration implements WebSocketConfigurer {
	private final DuelWebSocketHandler handler;
	private final DuelHandshakeInterceptor handshake;
	private final DuelMatchmakingProperties properties;
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		// /ws must win over the REST /{matchId} UUID mapping, including upgrade requests.
		((ServletWebSocketHandlerRegistry) registry).setOrder(-1);
		registry.addHandler(handler, "/api/duels/ws").addInterceptors(handshake)
				.setAllowedOrigins(properties.allowedOrigins().toArray(String[]::new));
	}
}

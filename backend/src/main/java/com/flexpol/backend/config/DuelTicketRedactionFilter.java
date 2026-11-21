package com.flexpol.backend.config;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Keep a one-use credential out of application URI/parameter logging and the retained socket URI. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DuelTicketRedactionFilter extends OncePerRequestFilter {
	public static final String CREDENTIAL = DuelTicketRedactionFilter.class.getName() + ".credential";

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) { return !"/api/duels/ws".equals(request.getServletPath()); }

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
		var tokens = request.getParameterValues("ticket");
		if (tokens != null && tokens.length == 1) request.setAttribute(CREDENTIAL, tokens[0]);
		chain.doFilter(new HttpServletRequestWrapper(request) {
			@Override public String getQueryString() { return "ticket=REDACTED"; }
			@Override public String getParameter(String name) { return "ticket".equals(name) ? "REDACTED" : super.getParameter(name); }
			@Override public String[] getParameterValues(String name) { return "ticket".equals(name) ? new String[] { "REDACTED" } : super.getParameterValues(name); }
			@Override public Map<String, String[]> getParameterMap() {
				var parameters = new LinkedHashMap<>(super.getParameterMap());
				parameters.put("ticket", new String[] { "REDACTED" });
				return parameters;
			}
		}, response);
	}
}

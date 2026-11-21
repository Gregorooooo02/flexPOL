package com.flexpol.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/** Full replacement draft, in EUR; null/malformed fields are validated by the match service. */
public record DuelPortfolioRequest(Long expectedRevision, List<Allocation> allocations) {

	public record Allocation(Long instrumentId, BigDecimal amount) {
	}
}

package com.flexpol.backend.entity;

import java.util.List;

/** Public inputs to a what-if exercise. All other holdings are unchanged in the example. */
public record PortfolioComparison(
		String company, int startingBalance, int dropPercent, List<Portfolio> portfolios) {

	public record Portfolio(String id, String name, int exposurePercent, String description) {}
}

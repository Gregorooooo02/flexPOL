package com.flexpol.backend.dto;

import com.flexpol.backend.entity.Subchapter;

/** A subchapter as listed in the learning path, without the lesson body. */
public record SubchapterSummaryResponse(Long id, String code, Integer sortOrder, String title, String sandboxInstrument) {

	public static SubchapterSummaryResponse from(Subchapter subchapter) {
		return new SubchapterSummaryResponse(
				subchapter.getId(),
				subchapter.getCode(),
				subchapter.getSortOrder(),
				subchapter.getTitle(),
				subchapter.getSandboxInstrument());
	}
}

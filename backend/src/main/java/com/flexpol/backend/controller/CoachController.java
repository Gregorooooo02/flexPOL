package com.flexpol.backend.controller;

import com.flexpol.backend.dto.CoachRequest;
import com.flexpol.backend.dto.CoachResponse;
import com.flexpol.backend.service.CoachService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

	private final CoachService coachService;

	@PostMapping("/messages")
	public CoachResponse ask(
			@RequestBody CoachRequest request,
			@RequestHeader(name = UserHeader.NAME, required = false) String userEmail) {
		return coachService.ask(request, userEmail);
	}
}

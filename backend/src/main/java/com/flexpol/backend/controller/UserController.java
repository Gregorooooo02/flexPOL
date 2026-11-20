package com.flexpol.backend.controller;

import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.dto.UserResponse;
import com.flexpol.backend.service.UserService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@PostMapping("/login")
	public UserResponse login(@RequestBody LoginRequest request) {
		return userService.login(request);
	}
}

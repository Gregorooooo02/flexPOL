package com.flexpol.backend.service;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.dto.UserResponse;
import com.flexpol.backend.entity.User;
import com.flexpol.backend.exception.BadRequestException;
import com.flexpol.backend.exception.UnauthorizedException;
import com.flexpol.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;

/**
 * Mock login for the hackathon: no password or token. The email (trimmed, lower-cased)
 * identifies the learner; logging in with a new email creates a user, and logging in with
 * a known one returns it and updates the display name.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

	static final int MAX_USERNAME_LENGTH = 50;
	static final int MAX_EMAIL_LENGTH = 254;
	private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

	private final UserRepository userRepository;

	@Transactional
	public UserResponse login(LoginRequest request) {
		if (request == null) {
			throw new BadRequestException("username and email are required");
		}
		String username = request.username() == null ? "" : request.username().strip();
		String email = request.email() == null ? "" : request.email().strip().toLowerCase(Locale.ROOT);

		if (username.isEmpty()) {
			throw new BadRequestException("username is required");
		}
		if (username.length() > MAX_USERNAME_LENGTH) {
			throw new BadRequestException("username must be at most " + MAX_USERNAME_LENGTH + " characters");
		}
		if (email.length() > MAX_EMAIL_LENGTH || !EMAIL.matcher(email).matches()) {
			throw new BadRequestException("email must be a valid email address");
		}

		User user = userRepository.findByEmail(email)
				.orElseGet(() -> userRepository.save(new User(username, email)));
		user.setUsername(username);
		return UserResponse.from(user);
	}

	/**
	 * The learner named by the {@code X-User-Email} header, or empty when the header is absent.
	 * Joins the caller's transaction, so the entity can be used there.
	 *
	 * @throws UnauthorizedException if the header names no known user (for example after a restart
	 *         of the in-memory database); the frontend then asks the learner to log in again
	 */
	public Optional<User> findCurrentUser(String userEmail) {
		if (!StringUtils.hasText(userEmail)) {
			return Optional.empty();
		}
		String email = userEmail.strip().toLowerCase(Locale.ROOT);
		return Optional.of(userRepository.findByEmail(email)
				.orElseThrow(() -> new UnauthorizedException("Unknown user " + email + "; log in again")));
	}

	/** Like {@link #findCurrentUser}, but the learner must be logged in. */
	public User requireCurrentUser(String userEmail) {
		return findCurrentUser(userEmail)
				.orElseThrow(() -> new UnauthorizedException("Log in first: the X-User-Email header is missing"));
	}
}

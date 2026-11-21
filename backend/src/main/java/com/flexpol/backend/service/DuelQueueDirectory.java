package com.flexpol.backend.service;

import java.util.UUID;
import com.flexpol.backend.entity.DuelPhase;
import com.flexpol.backend.repository.DuelMatchRepository;
import com.flexpol.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/** Database boundaries finish before the in-memory queue is locked or a socket is touched. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, timeout = 5)
public class DuelQueueDirectory {
	private final UserService users;
	private final UserRepository userRepository;
	private final DuelMatchRepository matches;
	private final DuelMatchService matchService;

	public record Status(boolean exists, UUID matchId) { }

	public Long resolve(String email) { return users.requireCurrentUser(email).getId(); }

	public Status status(Long userId) {
		boolean exists = userRepository.existsById(userId);
		return new Status(exists, exists ? matches.findActiveReferences(userId, DuelPhase.ACTIVE_PHASES,
				PageRequest.of(0, 1)).stream().findFirst().orElse(null) : null);
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 5)
	public UUID create(Long first, Long second) { return matchService.createMatch(first, second); }
}

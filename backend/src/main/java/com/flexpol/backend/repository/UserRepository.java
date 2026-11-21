package com.flexpol.backend.repository;

import java.util.Optional;

import com.flexpol.backend.entity.User;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	/** Duel creation always takes both user locks in ascending ID order. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select u from User u where u.id = :id")
	Optional<User> findLockedById(Long id);
}

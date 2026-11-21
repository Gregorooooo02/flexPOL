package com.flexpol.backend.repository;

import java.util.Optional;

import com.flexpol.backend.entity.DuelRating;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface DuelRatingRepository extends JpaRepository<DuelRating, Long> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from DuelRating r where r.userId = :userId")
	Optional<DuelRating> findLockedByUserId(Long userId);
}

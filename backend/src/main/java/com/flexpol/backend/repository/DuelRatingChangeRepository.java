package com.flexpol.backend.repository;

import java.util.List;
import java.util.UUID;

import com.flexpol.backend.entity.DuelRatingChange;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DuelRatingChangeRepository extends JpaRepository<DuelRatingChange, Long> {
	List<DuelRatingChange> findByMatchIdOrderBySeatAsc(UUID matchId);
}

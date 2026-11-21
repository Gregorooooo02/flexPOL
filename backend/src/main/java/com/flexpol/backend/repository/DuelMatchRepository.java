package com.flexpol.backend.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.flexpol.backend.entity.DuelMatch;
import com.flexpol.backend.entity.DuelPhase;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface DuelMatchRepository extends JpaRepository<DuelMatch, UUID> {

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select m from DuelMatch m where m.id = :id")
	Optional<DuelMatch> findLockedById(UUID id);

	@Query("""
			select m.id from DuelMatch m
			where (m.phase = :briefing and m.planningStartsAt <= :now)
			   or (m.phase = :planning and m.planningEndsAt <= :now)
			order by m.planningEndsAt, m.id
			""")
	List<UUID> findDueIds(DuelPhase briefing, DuelPhase planning, Instant now, Pageable page);

	@Query("""
			select count(p) > 0 from DuelParticipant p
			where p.user.id = :userId and p.match.phase in :phases
			""")
	boolean hasActiveMatch(Long userId, Collection<DuelPhase> phases);

	@Query("""
			select m.id from DuelMatch m where m.phase = :phase
			and (m.evaluationClaimToken is null or m.evaluationClaimExpiresAt <= :now)
			order by m.evaluationStartedAt, m.id
			""")
	List<UUID> findEvaluationIds(DuelPhase phase, Instant now, Pageable page);
}

package com.flexpol.backend.repository;

import java.util.UUID;
import com.flexpol.backend.entity.DuelResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DuelResultRepository extends JpaRepository<DuelResult, UUID> {
}

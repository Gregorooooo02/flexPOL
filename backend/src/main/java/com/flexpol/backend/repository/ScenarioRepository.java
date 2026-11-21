package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.Scenario;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {

	List<Scenario> findAllByOrderBySortOrderAsc();
}

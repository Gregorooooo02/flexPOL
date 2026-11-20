package com.flexpol.backend.repository;

import java.util.List;
import java.util.Optional;

import com.flexpol.backend.entity.Subchapter;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubchapterRepository extends JpaRepository<Subchapter, Long> {

	Optional<Subchapter> findByCode(String code);

	List<Subchapter> findByChapterIdOrderBySortOrderAsc(Long chapterId);
}

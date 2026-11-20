package com.flexpol.backend.repository;

import java.util.List;

import com.flexpol.backend.entity.Chapter;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

	List<Chapter> findAllByOrderBySortOrderAsc();
}

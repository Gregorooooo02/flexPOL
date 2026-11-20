package com.flexpol.backend.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A chapter of the learning path, e.g. "Why Invest?". */
@Entity
@Table(name = "chapter")
@Getter
@Setter
@NoArgsConstructor
public class Chapter {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Integer sortOrder;

	@Column(nullable = false)
	private String title;

	@Column(length = 1000)
	private String objective;

	private String missionTitle;

	@Column(length = 2000)
	private String missionDescription;

	@OneToMany(mappedBy = "chapter")
	@OrderBy("sortOrder ASC")
	private List<Subchapter> subchapters = new ArrayList<>();
}

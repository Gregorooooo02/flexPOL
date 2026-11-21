package com.flexpol.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One lesson inside a chapter, e.g. "1.3 Time Horizon and Liquidity". */
@Entity
@Table(name = "subchapter", uniqueConstraints = @UniqueConstraint(columnNames = { "chapter_id", "sort_order" }))
@Getter
@Setter
@NoArgsConstructor
public class Subchapter {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "chapter_id", nullable = false)
	private Chapter chapter;

	@Column(nullable = false)
	private Integer sortOrder;

	/** Display code such as "1.3". */
	@Column(nullable = false, unique = true, length = 10)
	private String code;

	@Column(nullable = false)
	private String title;

	@Column(length = 1000)
	private String goal;

	/** Sandbox instrument this lesson introduces, if any. */
	@Column(length = 40)
	private String sandboxInstrument;

	/** Body of the lesson as Markdown, rendered by the frontend. */
	// text on PostgreSQL; @Lob would map to a large-object oid there
	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Column(nullable = false)
	private String lessonMarkdown;
}

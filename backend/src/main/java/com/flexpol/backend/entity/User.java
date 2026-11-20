package com.flexpol.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "USER")
@Getter
@Setter
@NoArgsConstructor
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Display name only; several learners may share one. The email identifies the user. */
	@Column(nullable = false, length = 50)
	private String username;

	/** Trimmed and lower-cased. */
	@Column(nullable = false, unique = true, length = 254)
	private String email;

	public User(String username, String email) {
		this.username = username;
		this.email = email;
	}
}

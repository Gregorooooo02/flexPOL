package com.flexpol.backend.repository;

import com.flexpol.backend.entity.User;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UserRepositoryTests {

	@Autowired
	private UserRepository userRepository;

	@Test
	void loadsUsersFromDataSql() {
		assertThat(userRepository.findAll())
				.extracting(User::getUsername)
				.containsExactlyInAnyOrder("jkowalski", "anowak", "pwisniewski");
	}
}

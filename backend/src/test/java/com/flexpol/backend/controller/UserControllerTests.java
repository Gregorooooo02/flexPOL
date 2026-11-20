package com.flexpol.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.flexpol.backend.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/** Mock login. Rolled back after each test so the seeded users stay as they are. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Test
	void newEmailCreatesUserWithNormalizedEmail() throws Exception {
		long before = userRepository.count();

		mockMvc.perform(login("{\"username\": \"  Ada  \", \"email\": \" Ada@Example.COM \"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.username").value("Ada"))
				.andExpect(jsonPath("$.email").value("ada@example.com"));

		assertThat(userRepository.count()).isEqualTo(before + 1);
	}

	@Test
	void knownEmailReturnsSameUserAndUpdatesName() throws Exception {
		long before = userRepository.count();
		Long seededId = userRepository.findByEmail("anna.nowak@example.com").orElseThrow().getId();

		mockMvc.perform(login("{\"username\": \"Anna\", \"email\": \"ANNA.NOWAK@example.com\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(seededId))
				.andExpect(jsonPath("$.username").value("Anna"));

		assertThat(userRepository.count()).isEqualTo(before);
	}

	@Test
	void usernamesMayRepeat() throws Exception {
		mockMvc.perform(login("{\"username\": \"anowak\", \"email\": \"other@example.com\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void rejectsInvalidInput() throws Exception {
		mockMvc.perform(login("{\"username\": \" \", \"email\": \"ada@example.com\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("username is required"));
		mockMvc.perform(login("{\"username\": \"Ada\", \"email\": \"not-an-email\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("email must be a valid email address"));
		mockMvc.perform(login("{\"username\": \"" + "a".repeat(51) + "\", \"email\": \"ada@example.com\"}"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(login("{}")).andExpect(status().isBadRequest());
	}

	private static RequestBuilder login(String body) {
		return post("/api/users/login").contentType(MediaType.APPLICATION_JSON).content(body);
	}
}

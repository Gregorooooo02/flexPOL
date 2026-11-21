package com.flexpol.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.flexpol.backend.dto.DuelNotification;
import com.flexpol.backend.dto.DuelPortfolioRequest;
import com.flexpol.backend.dto.LoginRequest;
import com.flexpol.backend.exception.DuelConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(properties = { "hedgeflex.duel.coordinator-enabled=false", "spring.datasource.url=jdbc:h2:mem:duel-lifecycle-tests;NON_KEYWORDS=USER" })
@Import(DuelMatchServiceTests.TimeConfiguration.class)
class DuelEventsTests {
	@Autowired private DuelMatchService matches;
	@Autowired private DuelApiService api;
	@Autowired private DuelEvaluationWorker evaluator;
	@Autowired private UserService users;
	@Autowired private DuelRealtimeService realtime;
	@Autowired private PlatformTransactionManager transactions;
	@Autowired private DuelMatchServiceTests.MutableClock clock;
	@Autowired private JsonMapper json;

	@BeforeEach void time() { clock.set(Instant.parse("2026-11-21T12:00:00Z")); }

	@Test
	void onlyCommittedChangesNotifyIncludingLateConflictsAndPrivateDraftSaves() {
		var first = users.login(new LoginRequest("First", UUID.randomUUID() + "@duel.test"));
		var second = users.login(new LoginRequest("Second", UUID.randomUUID() + "@duel.test"));
		var a = attach(first.id()); var b = attach(second.id());
		try {
			var tx = new TransactionTemplate(transactions);
			tx.executeWithoutResult(status -> {
				matches.createMatch(first.id(), second.id());
				assertThat(a.messages).isEmpty();
				status.setRollbackOnly();
			});
			assertThat(a.messages).isEmpty();
			assertThat(b.messages).isEmpty();
			var id = matches.createMatch(first.id(), second.id());
			assertThat(a.messages).anyMatch(text -> text.contains("MATCH_FOUND"));
			var brief = api.getMatch(id, first.email());
			clock.set(brief.planningStartsAt()); api.getMatch(id, first.email());
			a.messages.clear(); b.messages.clear();
			var plan = new DuelPortfolioRequest(0L, List.of(new DuelPortfolioRequest.Allocation(brief.scenario().instruments().getFirst().id(), new BigDecimal("100"))));
			tx.executeWithoutResult(status -> { api.saveDraft(id, plan, first.email()); status.setRollbackOnly(); });
			assertThat(a.messages).isEmpty();
			api.saveDraft(id, plan, first.email());
			assertThat(a.messages).hasSize(1);
			assertThat(b.messages).isEmpty(); // opponent never receives editing activity
			api.saveDraft(id, plan, second.email());
			a.messages.clear(); b.messages.clear();
			clock.set(brief.planningEndsAt());
			assertThatThrownBy(() -> api.saveDraft(id, plan, first.email())).isInstanceOf(DuelConflictException.class);
			assertThat(a.messages).isNotEmpty();
			assertThat(b.messages).isNotEmpty();
			evaluator.evaluateMatch(id);
			clock.set(api.getMatch(id, first.email()).replayEndsAt());
			api.getMatch(id, first.email());
			assertThat(a.messages).anyMatch(text -> json.readValue(text, DuelNotification.class).type() == DuelNotification.Type.RATING_CHANGED);
			assertThat(b.messages).allSatisfy(text -> assertThat(text).doesNotContain("parameters", "allocations", "seed", "@duel.test"));
		} finally { realtime.disconnect(a.id()); realtime.disconnect(b.id()); }
	}

	private DuelRealtimeServiceTests.Peer attach(Long userId) {
		var peer = new DuelRealtimeServiceTests.Peer(true);
		assertThat(realtime.attach(realtime.consumeTicket(realtime.issueTicket(userId).ticket()).orElseThrow(), peer)).isTrue();
		return peer;
	}
}

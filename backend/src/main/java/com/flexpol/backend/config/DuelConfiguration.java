package com.flexpol.backend.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@EnableConfigurationProperties({ DuelProperties.class, DuelMatchmakingProperties.class })
public class DuelConfiguration {

	@Bean
	Clock duelClock() {
		return Clock.systemUTC();
	}

	@Bean
	ThreadPoolTaskExecutor duelMatchmakingExecutor() {
		var executor = new ThreadPoolTaskExecutor();
		executor.setThreadNamePrefix("duel-matchmaking-");
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(1);
		executor.setQueueCapacity(0);
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(5);
		return executor;
	}

	@Bean
	ThreadPoolTaskExecutor duelSocketCloseExecutor() {
		var executor = new ThreadPoolTaskExecutor();
		executor.setThreadNamePrefix("duel-socket-close-");
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(128);
		executor.setAwaitTerminationSeconds(5);
		return executor;
	}

	@Bean
	ThreadPoolTaskExecutor duelEvaluationExecutor() {
		var executor = new ThreadPoolTaskExecutor();
		executor.setThreadNamePrefix("duel-evaluation-");
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(0);
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(5);
		return executor;
	}
}

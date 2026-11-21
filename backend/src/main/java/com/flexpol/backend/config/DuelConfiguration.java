package com.flexpol.backend.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@EnableConfigurationProperties(DuelProperties.class)
public class DuelConfiguration {

	@Bean
	Clock duelClock() {
		return Clock.systemUTC();
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

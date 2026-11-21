package com.flexpol.backend.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@EnableConfigurationProperties(DuelProperties.class)
public class DuelConfiguration {

	@Bean
	Clock duelClock() {
		return Clock.systemUTC();
	}
}

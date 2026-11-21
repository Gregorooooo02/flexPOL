package com.flexpol.backend.config;

import java.io.IOException;
import java.time.Duration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the bundled React app from {@code classpath:/static/} (copied there by the
 * {@code bundle-frontend} Maven profile).
 *
 * <p>
 * Client-side routes such as {@code /learning} have no file behind them, so any path that is not
 * a file falls back to {@code index.html} and React Router takes over. Paths under {@code api/}
 * and paths that look like files (with an extension) never fall back, so a missing endpoint or
 * asset still returns 404. Without a bundled frontend (local development) nothing is served.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

	private static final String LOCATION = "classpath:/static/";

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// Vite puts a content hash in every file name under assets/, so they never change.
		registry.addResourceHandler("/assets/**")
			.addResourceLocations(LOCATION + "assets/")
			.setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());

		// Everything else (index.html, public/ files) is revalidated so a deploy shows up at once.
		registry.addResourceHandler("/**")
			.addResourceLocations(LOCATION)
			.setCacheControl(CacheControl.noCache())
			.resourceChain(true)
			.addResolver(new SpaFallbackResolver());
	}

	private static final class SpaFallbackResolver extends PathResourceResolver {

		@Override
		protected Resource getResource(String resourcePath, Resource location) throws IOException {
			Resource requested = super.getResource(resourcePath, location);
			if (requested != null) {
				return requested;
			}
			if (resourcePath.startsWith("api/") || resourcePath.equals("api") || hasExtension(resourcePath)) {
				return null;
			}
			return super.getResource("index.html", location);
		}

		private static boolean hasExtension(String path) {
			return path.substring(path.lastIndexOf('/') + 1).contains(".");
		}
	}
}

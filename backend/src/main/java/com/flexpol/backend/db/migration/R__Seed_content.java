package com.flexpol.backend.db.migration;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.Statement;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.zip.CRC32;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Loads the learning content, instruments and scenarios from {@code data.sql} into PostgreSQL.
 *
 * <p>
 * A repeatable Flyway migration: it runs after the versioned schema migrations and again
 * whenever {@code data.sql} changes (its checksum is the file's CRC32). Each run empties every
 * table that {@code data.sql} inserts into and loads the file again. {@code TRUNCATE ... CASCADE}
 * also empties tables that reference the content, so <strong>saved quiz attempts are deleted
 * when the content changes</strong>. Learners and coach conversations are kept.
 *
 * <p>
 * Flyway runs it in one transaction, so a failed load leaves the previous content in place.
 * Registered as a bean so Spring Boot hands it to Flyway; it does nothing while Flyway is off
 * (the default H2 profile, which loads {@code data.sql} through {@code spring.sql.init}).
 */
@Component
public class R__Seed_content extends BaseJavaMigration {

	private static final String SCRIPT = "data.sql";

	private static final Pattern INSERT_TABLE = Pattern.compile("(?im)^\\s*INSERT\\s+INTO\\s+(\\w+)");

	@Override
	public Integer getChecksum() {
		var crc = new CRC32();
		crc.update(readScript().getBytes(StandardCharsets.UTF_8));
		return (int) crc.getValue();
	}

	@Override
	public void migrate(Context context) throws Exception {
		String script = readScript();
		Set<String> tables = new LinkedHashSet<>();
		INSERT_TABLE.matcher(script).results().forEach(match -> tables.add(match.group(1).toLowerCase()));
		if (tables.isEmpty()) {
			throw new IllegalStateException(SCRIPT + " has no INSERT statements");
		}
		try (Statement statement = context.getConnection().createStatement()) {
			statement.execute("TRUNCATE TABLE " + String.join(", ", tables) + " RESTART IDENTITY CASCADE");
			// The PostgreSQL driver sends a multi-statement string in a single round trip.
			statement.execute(script);
		}
	}

	/** Line endings are normalised so a checkout with CRLF gives the same checksum. */
	private static String readScript() {
		try {
			return new ClassPathResource(SCRIPT).getContentAsString(StandardCharsets.UTF_8).replace("\r\n", "\n");
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Cannot read " + SCRIPT, ex);
		}
	}
}

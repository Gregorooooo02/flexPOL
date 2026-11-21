# HedgeFlex: React frontend bundled into the Spring Boot jar, for Cloud Run.
# Build from the repository root:  docker build -t hedgeflex .
# The image runs the 'postgres' profile; see backend/src/main/resources/application-postgres.properties
# for the DATABASE_* variables. OPENAI_API_KEY enables the AI coach.

# --- 1. Frontend ------------------------------------------------------------
# Debian-based image: TypeScript 7's native compiler ships glibc binaries.
FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. Backend jar with the frontend inside ---------------------------------
# Uses the image's Maven rather than mvnw, which may have CRLF line endings on Windows checkouts.
FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline -Pbundle-frontend
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist /app/frontend/dist
RUN mvn -B -q -Pbundle-frontend -DskipTests package \
	&& cp target/backend-*.jar /app/app.jar

# --- 3. Runtime --------------------------------------------------------------
FROM eclipse-temurin:25-jre
RUN useradd --system --uid 10001 app
USER app
WORKDIR /app
COPY --from=backend /app/app.jar app.jar
ENV SPRING_PROFILES_ACTIVE=postgres \
	JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
# Cloud Run sends traffic to $PORT (8080 by default); server.port reads it.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

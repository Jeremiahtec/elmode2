# Multi-stage build: compile with a full JDK+Maven image, run on a slim JRE.
# Keeps the final deployed image small and avoids shipping Maven/build tools
# to production.

# --- Stage 1: build ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml first and download dependencies separately from source code.
# Docker caches layers by content hash: as long as pom.xml doesn't change,
# this dependency-download layer is reused on every rebuild, so editing a
# .java file doesn't re-download the internet on every deploy.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Stage 2: run ---
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Matches the fat-jar name pattern produced by spring-boot-maven-plugin
# (artifactId-version.jar, e.g. elmode-0.0.1-SNAPSHOT.jar) without hardcoding
# the exact version string, so bumping <version> in pom.xml doesn't break this.
COPY --from=build /app/target/*.jar app.jar

# Render sets $PORT at runtime; application.properties already reads it via
# server.port=${PORT:8080}. EXPOSE here is documentation only (Render doesn't
# require it, but it's correct and harmless for any other Docker host).
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

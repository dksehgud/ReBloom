# syntax=docker/dockerfile:1.7

# Gradle build image
FROM eclipse-temurin:21-jdk AS build

# Container working directory
WORKDIR /app

# Copy root Gradle files
COPY gradlew gradlew.bat build.gradle settings.gradle ./
# Copy root Gradle wrapper
COPY gradle ./gradle
# Copy shared modules
COPY modules ./modules
# Copy biometric-service source
COPY services/biometric-service ./services/biometric-service

# Build biometric-service jar
RUN --mount=type=cache,target=/root/.gradle \
    chmod +x ./gradlew && ./gradlew :services:biometric-service:bootJar -x test --no-daemon

# Runtime-only JRE image
FROM eclipse-temurin:21-jre AS runtime

# Application runtime directory
WORKDIR /app

# Copy built jar
COPY --from=build /tmp/rebloom-gradle/services/biometric-service/libs/*.jar app.jar

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]

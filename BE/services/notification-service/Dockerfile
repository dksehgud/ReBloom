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
# Copy notification-service source
COPY services/notification-service ./services/notification-service

# Build notification-service jar
RUN --mount=type=cache,target=/root/.gradle \
    chmod +x ./gradlew && ./gradlew :services:notification-service:bootJar -x test --no-daemon

# Runtime-only JRE image
FROM eclipse-temurin:21-jre AS runtime

# Application runtime directory
WORKDIR /app

# Copy built jar
COPY --from=build /tmp/rebloom-gradle/services/notification-service/libs/*.jar app.jar

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]

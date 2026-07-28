# =============================================================================
#  Guest House Manager — Backend API Dockerfile
#  Multi-Stage Build for AWS Free Tier (Java 21 Spring Boot 3.4)
# =============================================================================

# --- Stage 1: Build JAR artifact ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM first to leverage Docker layer caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
# Copy source code and build production package
COPY src src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Production Runtime ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directory for file uploads
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Copy built JAR from builder stage
COPY --chown=appuser:appgroup --from=builder /app/target/guesthouse-api.jar app.jar

USER appuser

EXPOSE 8080

# Tuned JVM parameters for low memory (AWS Free Tier 1GB RAM)
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

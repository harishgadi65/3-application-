# ---- Build stage -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Cache dependencies separately from source for faster rebuilds.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- Runtime stage ----------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S smartad && adduser -S smartad -G smartad
WORKDIR /app

COPY --from=build /build/target/smart-ad-backend.jar ./app.jar

RUN chown -R smartad:smartad /app
USER smartad

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

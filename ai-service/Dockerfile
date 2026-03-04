FROM eclipse-temurin:17-jdk AS build

# Disable Gradle daemon for Docker compatibility
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.workers.max=2"
WORKDIR /app

# Copy and publish common-lib
COPY common-lib/ common-lib/
WORKDIR /app/common-lib
RUN chmod +x gradlew && ./gradlew publishToMavenLocal -x test
WORKDIR /app

# Copy and build ai-service
COPY ai-service/ ai-service/
WORKDIR /app/ai-service
RUN chmod +x gradlew && ./gradlew :ai-service-impl:bootJar -x test
WORKDIR /app

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/ai-service/ai-service-impl/build/libs/ai-service-impl-1.0.0.jar app.jar
EXPOSE 8086
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

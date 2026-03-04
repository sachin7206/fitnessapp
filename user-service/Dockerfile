FROM eclipse-temurin:17-jdk AS build

# Disable Gradle daemon for Docker compatibility
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.workers.max=2"
WORKDIR /app

# Copy and publish common-lib
COPY common-lib/ common-lib/
WORKDIR /app/common-lib
RUN chmod +x gradlew && ./gradlew publishToMavenLocal -x test
WORKDIR /app

# Copy and publish ai-service shared modules
COPY ai-service/ ai-service/
WORKDIR /app/ai-service
RUN chmod +x gradlew && ./gradlew :ai-service-common:publishToMavenLocal :ai-service-sal:publishToMavenLocal -x test
WORKDIR /app

# Copy and build user-service
COPY user-service/ user-service/
WORKDIR /app/user-service
RUN chmod +x gradlew && ./gradlew :user-service-common:publishToMavenLocal :user-service-sal:publishToMavenLocal -x test
RUN ./gradlew :user-service-impl:bootJar -x test
WORKDIR /app

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/user-service/user-service-impl/build/libs/user-service-impl-1.0.0.jar app.jar
EXPOSE 8081
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

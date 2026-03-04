FROM gradle:8-jdk17 AS build
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

# Copy and publish user-service shared modules
COPY user-service/ user-service/
WORKDIR /app/user-service
RUN chmod +x gradlew && ./gradlew :user-service-common:publishToMavenLocal :user-service-sal:publishToMavenLocal -x test
WORKDIR /app

# Copy and build exercise-service
COPY exercise-service/ exercise-service/
WORKDIR /app/exercise-service
RUN chmod +x gradlew && ./gradlew :exercise-service-impl:bootJar -x test
WORKDIR /app

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/exercise-service/exercise-service-impl/build/libs/exercise-service-impl-1.0.0.jar app.jar
EXPOSE 8083
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

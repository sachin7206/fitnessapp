FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY common-lib/ common-lib/
RUN cd common-lib && gradle publishToMavenLocal -x test
COPY ai-service/ ai-service/
RUN cd ai-service && gradle :ai-service-common:publishToMavenLocal :ai-service-sal:publishToMavenLocal -x test
COPY progress-service/ progress-service/
RUN cd progress-service && gradle :progress-service-impl:bootJar -x test
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/progress-service/progress-service-impl/build/libs/progress-service-impl-1.0.0.jar app.jar
EXPOSE 8084
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]


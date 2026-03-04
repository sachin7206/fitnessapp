FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY common-lib/ common-lib/
RUN cd common-lib && gradle publishToMavenLocal -x test
COPY ai-service/ ai-service/
RUN cd ai-service && gradle :ai-service-common:publishToMavenLocal :ai-service-sal:publishToMavenLocal -x test
COPY user-service/ user-service/
RUN cd user-service && gradle :user-service-common:publishToMavenLocal :user-service-sal:publishToMavenLocal -x test
COPY wellness-service/ wellness-service/
RUN cd wellness-service && gradle :wellness-service-impl:bootJar -x test
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/wellness-service/wellness-service-impl/build/libs/wellness-service-impl-1.0.0.jar app.jar
EXPOSE 8085
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]


FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY common-lib/ common-lib/
RUN cd common-lib && gradle publishToMavenLocal -x test
COPY api-gateway/ api-gateway/
RUN cd api-gateway && gradle bootJar -x test
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/api-gateway/build/libs/api-gateway-1.0.0.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]


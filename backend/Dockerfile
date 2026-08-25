FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve -B -q || true
COPY src ./src
RUN mvn clean package -DskipTests -B && cp target/cbrsx-backend-*.jar target/app.jar && rm -f target/app.jar.original || true

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S cbrsx && adduser -S cbrsx -G cbrsx
USER cbrsx
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q UP || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

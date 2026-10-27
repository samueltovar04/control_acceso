# --- STAGE 1: Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /code

# Copy dependencies first for efficient layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B -Daether.connector.http.retryHandler.count=5 || true

# Copy source code and build package
COPY src ./src
RUN mvn package -DskipTests -Daether.connector.http.retryHandler.count=5

# --- STAGE 2: Lightweight Runtime stage ---
FROM eclipse-temurin:17-jre
WORKDIR /work/

# Copy compiled Quarkus application files
COPY --from=build /code/target/quarkus-app/lib/ /work/lib/
COPY --from=build /code/target/quarkus-app/*.jar /work/
COPY --from=build /code/target/quarkus-app/app/ /work/app/
COPY --from=build /code/target/quarkus-app/quarkus/ /work/quarkus/

EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /work/quarkus-run.jar"]

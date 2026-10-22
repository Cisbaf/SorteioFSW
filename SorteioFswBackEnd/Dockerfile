# ---- build ----
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# user.timezone fixa o fuso do JVM (nome do arquivo Excel usa a data de hoje); não depende de tzdata no sistema.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=America/Sao_Paulo"
# Roda sem root. O *.jar não pega o .jar.original gerado pelo plugin do Spring Boot.
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/target/*.jar app.jar
USER app
EXPOSE 8080
# Sem actuator: qualquer resposta HTTP (o /participante responde 401 sem login) prova que o Spring subiu.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qS -O /dev/null http://127.0.0.1:8080/participante 2>&1 | grep -q 'HTTP/' || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

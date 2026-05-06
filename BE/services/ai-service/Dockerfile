FROM eclipse-temurin:21-jre
WORKDIR /app
COPY services/ai-service/build/libs/ /app/libs/
ENTRYPOINT ["sh", "-c", "java -jar $(find /app/libs -name '*.jar' ! -name '*-plain.jar' | head -n 1)"]
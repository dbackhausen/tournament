# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew clean build -x test

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs /libs
RUN cp $(ls /libs/*.jar | grep -v plain | head -1) app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

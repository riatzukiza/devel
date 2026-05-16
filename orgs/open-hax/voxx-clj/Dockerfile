FROM clojure:temurin-21-tools-deps AS build
WORKDIR /build
COPY deps.edn build.clj .
RUN clojure -P
COPY src src
COPY resources resources
RUN clojure -T:build uber

FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl espeak-ng ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system voxx \
    && useradd --system --gid voxx --home-dir /app --shell /usr/sbin/nologin voxx
WORKDIR /app
COPY --from=build /build/target/voxx-standalone.jar .
RUN mkdir -p /app/data && chown -R voxx:voxx /app
USER voxx:voxx
EXPOSE 8788
ENTRYPOINT ["java", "-jar", "voxx-standalone.jar"]

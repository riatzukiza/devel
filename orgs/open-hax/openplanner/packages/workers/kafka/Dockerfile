FROM clojure:temurin-21-tools-deps

WORKDIR /app

RUN mkdir -p /tmp/clojure-home/.clojure
ENV HOME=/tmp/clojure-home

COPY deps.edn ./
RUN clojure -P -M:audit && clojure -P -M:replay && clojure -P -M:graph-edges-backfill && clojure -P -M:check

COPY src ./src
COPY README.md ./README.md

RUN mkdir -p classes && clojure -M -e "(compile 'openplanner.kafka.jobs)"
RUN cp "$(grep -l 'audit' .cpcache/*.main | sed 's/.main$/.cp/')" .cpcache/runtime.cp
RUN chown -R 1000:1000 /tmp/clojure-home /app

USER 1000:1000

ENTRYPOINT []
CMD ["sh", "-lc", "/opt/java/openjdk/bin/java ${JAVA_OPTS:--XX:TieredStopAtLevel=1} -cp \"$(cat .cpcache/runtime.cp)\" openplanner.kafka.jobs audit"]

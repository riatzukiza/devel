FROM clojure:temurin-21-tools-deps-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl libusb-1.0-0 libze1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deps.edn ./
COPY src ./src
COPY models ./models
COPY native ./native
COPY vendor ./vendor
COPY openapi ./openapi
COPY README.md ./README.md

ENV VEXX_HOST=0.0.0.0 \
    VEXX_PORT=8788 \
    VEXX_DEVICE=NPU \
    VEXX_AUTO_ORDER=NPU,GPU,CPU \
    VEXX_REQUIRE_ACCEL=true \
    LD_LIBRARY_PATH=/app/vendor/onnxruntime-openvino/capi:${LD_LIBRARY_PATH}

EXPOSE 8788

CMD ["clojure", "-M:run"]

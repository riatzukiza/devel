FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    transformers \
    scipy \
    aiohttp

COPY server.py /app/server.py

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /cache/huggingface \
    && chown -R 1000:1000 /app /cache /home/appuser

ENV HF_HOME=/cache/huggingface \
    TRANSFORMERS_CACHE=/cache/huggingface \
    PYTHONUNBUFFERED=1

USER 1000:1000

EXPOSE 8080

CMD ["python", "server.py"]

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md server.py ./
COPY fork_tales_api ./fork_tales_api
COPY dist ./dist

RUN pip install --upgrade pip && pip install .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/healthz').status == 200 else 1)"

CMD ["python", "-m", "uvicorn", "fork_tales_api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8080"]

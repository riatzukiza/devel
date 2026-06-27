FROM public.ecr.aws/docker/library/debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd \
    privoxy \
    && rm -rf /var/lib/apt/lists/*

COPY config /etc/privoxy/config

EXPOSE 8118

CMD ["privoxy", "--no-daemon", "/etc/privoxy/config"]

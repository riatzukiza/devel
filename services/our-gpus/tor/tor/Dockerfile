FROM public.ecr.aws/docker/library/debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd \
    tor \
    && rm -rf /var/lib/apt/lists/*

COPY torrc /etc/tor/torrc

RUN mkdir -p /var/lib/tor && chown -R debian-tor:debian-tor /var/lib/tor /etc/tor

EXPOSE 9050

USER debian-tor

CMD ["tor", "-f", "/etc/tor/torrc"]

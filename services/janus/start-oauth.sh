#!/bin/bash
export OAUTH_ENABLED=true
export ALLOWED_HOSTS="localhost,127.0.0.1,.tailbe888a.ts.net"
exec node /home/err/devel/services/api-gateway/dist/main.js

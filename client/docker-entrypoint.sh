#!/bin/sh
# Inject API_URL from environment into runtime env.js before serving
printf 'window.env = {\n  API_URL: "%s"\n};\n' "${API_URL:-http://localhost:8080/api}" \
  > /usr/share/nginx/html/assets/env.js

exec nginx -g 'daemon off;'

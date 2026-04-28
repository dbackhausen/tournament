#!/bin/sh
# Inject API_URL into runtime env.js
printf 'window.env = {\n  API_URL: "%s"\n};\n' "${API_URL:-http://localhost:8080/api}" \
  > /usr/share/nginx/html/assets/env.js

# Railway assigns PORT dynamically — replace the hardcoded port in nginx config
sed -i "s/listen 80;/listen ${PORT:-80};/" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

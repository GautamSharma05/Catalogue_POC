FROM node:24-alpine AS build
WORKDIR /app


COPY package.json package-lock.json* .npmrc* ./
COPY apps/web/package.json apps/web/package.json


RUN npm ci --workspace=apps/web


COPY apps/web apps/web


ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace=apps/web


FROM nginx:stable-alpine


RUN rm /etc/nginx/conf.d/default.conf


COPY <<'EOF' /etc/nginx/conf.d/app.conf
server {
    listen 4173;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Vite hashed assets — cache aggressively (1 year).
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA: serve index.html for any route that doesn't match a file.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # gzip text-based assets on the fly.
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;
}
EOF

# Copy the built static files.
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 4173
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]

FROM node:22.11.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

ENV NGINX_PORT=8080

COPY --chmod=444 nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder --chmod=555 /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

FROM node:22.11.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build


FROM node:22.11.0-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache tini=~0.19 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs remindy

WORKDIR /app

COPY --chmod=444 package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force && \
    chmod -R 555 /app/node_modules

COPY --from=builder --chmod=555 /app/dist ./dist

USER remindy

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]

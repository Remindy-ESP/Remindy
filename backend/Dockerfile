FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN chmod 444 package*.json
RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/dist ./dist
RUN chmod -R 555 ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN chown node:node package*.json && chmod 444 package*.json && npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN chown -R node:node ./dist && chmod -R 555 ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]

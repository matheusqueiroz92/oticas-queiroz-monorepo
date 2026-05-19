FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune whatsapp-bot --docker

FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=whatsapp-bot

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app
ENV NODE_ENV=production

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/whatsapp-bot/dist ./apps/whatsapp-bot/dist
RUN mkdir -p /app/apps/whatsapp-bot/data/auth

EXPOSE 3344
WORKDIR /app/apps/whatsapp-bot
CMD ["node", "dist/index.js"]

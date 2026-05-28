FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

FROM node:20-alpine AS installer
# python3/make/g++ necessários para compilar módulos nativos (bcrypt)
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=backend

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app
ENV NODE_ENV=production

# Copia node_modules já compilados (inclui binários nativos do bcrypt)
COPY --from=installer /app/node_modules ./node_modules
# Copia apenas o código compilado do backend
COPY --from=installer /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3333
CMD ["node", "apps/backend/dist/server.js"]

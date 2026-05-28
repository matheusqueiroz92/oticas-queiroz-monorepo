FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Pruna o projeto para focar apenas no app 'web'
RUN turbo prune web --docker

FROM node:20-alpine AS installer
WORKDIR /app
# NEXT_PUBLIC_* é embutido no bundle do cliente no build (passado via docker-compose build.args).
ARG NEXT_PUBLIC_API_URL=https://api.app.oticasqueiroz.com.br
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=builder /app/out/full/ .
# Build do Next.js
RUN npx turbo run build --filter=web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# O Next.js gera um servidor standalone se configurado no next.config.js
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]

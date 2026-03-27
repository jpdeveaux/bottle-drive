# =========================
# Base image (shared)
# =========================
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y tzdata openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

ENV TZ=America/Halifax
ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./

ARG DATABASE_URL

# =========================
# Development target
# =========================
FROM base AS dev

RUN npm install
COPY . .
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npx", "tsx", "src/index.ts"]

# =========================
# Builder target
# =========================
FROM base AS builder

RUN npm ci
COPY . .
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate
RUN npm run build

# =========================
# Production runner
# =========================
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY entrypoint.sh ./entrypoint.sh

# IMPORTANT: Re-generate the client in the production node_modules
RUN npm ci --omit=dev

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/index.js"]

# =========================
# Base image (shared)
# =========================
FROM node:25-slim AS base

RUN apt-get update && apt-get install -y tzdata openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

ENV TZ=America/Halifax
WORKDIR /app

COPY package*.json ./

# =========================
# Development target
# =========================
FROM base AS dev

ENV NODE_ENV=development

RUN npm install
COPY . .

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npx", "tsx", "src/index.ts"]

# =========================
# Builder target
# =========================
FROM base AS builder

ENV NODE_ENV=development
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# =========================
# Production runner
# =========================
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# IMPORTANT: Re-generate the client in the production node_modules
# We don't need a real URL here, just the variable name defined in schema.prisma
RUN npm ci --omit=dev
RUN npx prisma generate

RUN chmod +x /usr/local/bin/entrypoint.sh
# ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/index.js"]

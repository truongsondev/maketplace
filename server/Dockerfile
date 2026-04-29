FROM node:20-slim AS deps

WORKDIR /app

# Install full dependencies (including devDependencies) because runtime uses `npx prisma migrate deploy`.
COPY package*.json ./
RUN npm ci

FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY shared ./shared

# Generate Prisma client and build the server bundle.
RUN npx prisma generate
RUN npx tsup src/server.ts src/payos-reconcile-worker.ts --format esm

FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/resources ./resources
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./

EXPOSE 8080

CMD ["sh", "-c", "npx prisma generate && node dist/server.js"]

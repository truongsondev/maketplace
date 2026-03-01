# ====================================
# Stage 1: Builder
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src
COPY shared ./shared

# Build the application with tsup
RUN npx tsup src/server.ts --format esm

# ====================================
# Stage 2: Runner (Production)
# ====================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/generated ./generated

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy shared folder if needed at runtime
COPY --from=builder /app/shared ./shared

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "dist/server.js"]

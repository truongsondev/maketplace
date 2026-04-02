# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Serve the compiled Vite output (supports SPA fallback with -s)
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Run as non-root for production safety
RUN chown -R node:node /app
USER node

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]

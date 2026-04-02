# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Optional: override backend base URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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

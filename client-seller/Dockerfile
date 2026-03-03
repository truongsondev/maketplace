# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for build)
# Clean install to avoid native binding issues
RUN npm ci --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 5173 (as requested by user)
EXPOSE 5173

# Update nginx configuration to listen on port 5173
RUN sed -i 's/listen 80;/listen 5173;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen \[::\]:80;/listen [::]:5173;/g' /etc/nginx/conf.d/default.conf

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
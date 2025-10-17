# Multi-stage build for Rhizome Frontend
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bufferutil, etc.)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WEB3AUTH_CLIENT_ID
ARG VITE_WEB3AUTH_NETWORK

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WEB3AUTH_CLIENT_ID=${VITE_WEB3AUTH_CLIENT_ID}
ENV VITE_WEB3AUTH_NETWORK=${VITE_WEB3AUTH_NETWORK}

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

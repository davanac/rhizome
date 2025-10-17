# Rhizome Backend Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy application code (including start.sh and generate-wallet.js)
COPY . .

# Make scripts executable
RUN chmod +x /app/start.sh /app/generate-wallet.js

# Create directories
RUN mkdir -p /app/files /app/.rhizome

# Set default environment variables for wallet
ENV CFR_FILE_PATH=/app/.rhizome/cfr.json
ENV MASTER_KEY_PASSWORD=docker-test-password
ENV MASTER_KEY_ID=rhizome.docker.testnet

# Expose port 3000
EXPOSE 3000

# Health check - using wget which is already available in alpine
# Longer start-period to account for wallet generation and DB connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/v1 || exit 1

# Use start.sh script as entrypoint
CMD ["/bin/sh", "/app/start.sh"]

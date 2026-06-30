# Production Dockerfile for SHMS Backend
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "src/server.js"]

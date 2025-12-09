# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies for build
RUN npm install 

# Copy source code
COPY . .

# Build the application
RUN npm run build

WORKDIR /app

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
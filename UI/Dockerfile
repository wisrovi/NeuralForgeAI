# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies for build
RUN npm install 

# Copy source code
COPY . .

# Pass build arguments to Vite
ARG VITE_CONTROL_HOST
ARG VITE_API_HOST
ENV VITE_CONTROL_HOST=$VITE_CONTROL_HOST
ENV VITE_API_HOST=$VITE_API_HOST

# Build the application
RUN npm run build

WORKDIR /app

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
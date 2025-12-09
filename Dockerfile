# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies for build
RUN npm install 

# Copy source code
COPY . .

# Pass build args to environment
ARG VITE_MLFLOW_TRACKING_URI
ARG VITE_REDIS_TRACKING_URL
ARG VITE_FILEBROWSER_URL

ENV VITE_MLFLOW_TRACKING_URI=$VITE_MLFLOW_TRACKING_URI
ENV VITE_REDIS_TRACKING_URL=$VITE_REDIS_TRACKING_URL
ENV VITE_FILEBROWSER_URL=$VITE_FILEBROWSER_URL

# Build the application
RUN npm run build

WORKDIR /app

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
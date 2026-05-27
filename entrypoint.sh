#!/bin/sh

# Replace placeholders in the built JS files with environment variable values
# This allows runtime configuration for the compiled frontend

echo "Injecting runtime environment variables..."

# Define the variables to inject
# VITE_API_URL
if [ -n "$VITE_API_URL" ]; then
  # Remove trailing slash if present
  VITE_API_URL=$(echo $VITE_API_URL | sed 's|/$||')
  echo "Injecting VITE_API_URL=$VITE_API_URL"
  find /app/dist/assets -name "*.js" -exec sed -i "s|PLACEHOLDER_VITE_API_URL|$VITE_API_URL|g" {} +
fi

# VITE_MLFLOW_TRACKING_URI
if [ -n "$VITE_MLFLOW_TRACKING_URI" ]; then
  VITE_MLFLOW_TRACKING_URI=$(echo $VITE_MLFLOW_TRACKING_URI | sed 's|/$||')
  echo "Injecting VITE_MLFLOW_TRACKING_URI=$VITE_MLFLOW_TRACKING_URI"
  find /app/dist/assets -name "*.js" -exec sed -i "s|PLACEHOLDER_VITE_MLFLOW_TRACKING_URI|$VITE_MLFLOW_TRACKING_URI|g" {} +
fi

# VITE_REDIS_TRACKING_URL
if [ -n "$VITE_REDIS_TRACKING_URL" ]; then
  VITE_REDIS_TRACKING_URL=$(echo $VITE_REDIS_TRACKING_URL | sed 's|/$||')
  echo "Injecting VITE_REDIS_TRACKING_URL=$VITE_REDIS_TRACKING_URL"
  find /app/dist/assets -name "*.js" -exec sed -i "s|PLACEHOLDER_VITE_REDIS_TRACKING_URL|$VITE_REDIS_TRACKING_URL|g" {} +
fi

# VITE_FILEBROWSER_URL
if [ -n "$VITE_FILEBROWSER_URL" ]; then
  VITE_FILEBROWSER_URL=$(echo $VITE_FILEBROWSER_URL | sed 's|/$||')
  echo "Injecting VITE_FILEBROWSER_URL=$VITE_FILEBROWSER_URL"
  find /app/dist/assets -name "*.js" -exec sed -i "s|PLACEHOLDER_VITE_FILEBROWSER_URL|$VITE_FILEBROWSER_URL|g" {} +
fi

# GEMINI_API_KEY
if [ -n "$GEMINI_API_KEY" ]; then
  echo "Injecting GEMINI_API_KEY"
  find /app/dist/assets -name "*.js" -exec sed -i "s|PLACEHOLDER_GEMINI_API_KEY|$GEMINI_API_KEY|g" {} +
fi

# Execute the original command
exec "$@"

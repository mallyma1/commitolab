#!/bin/bash
# Start the server with Supabase DATABASE_URL

cd /workspaces/commitolab

# Build server
npm run server:build

# Start with DATABASE_URL from .env.production
export $(grep -v '^#' .env.production | xargs)
export EXPO_PUBLIC_API_URL=http://10.0.2.27:5000

echo "Starting server with DATABASE_URL: ${DATABASE_URL:0:50}..."
PORT=5000 BIND_HOST=0.0.0.0 NODE_ENV=development node server_dist/index.js

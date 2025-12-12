#!/bin/bash
# Expo Go Quick Start Script
# This script helps you launch Commito for development on your phone

set -e

echo "🚀 Commito - Expo Go Development Setup"
echo "======================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file with defaults..."
    cat > .env << EOF
EXPO_PUBLIC_DOMAIN=localhost:5000
DATABASE_URL=postgresql://user:password@localhost:5432/commitolab
PORT=5000
NODE_ENV=development
FREE_MODE=true
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies installed"
fi

echo ""
echo "📋 Starting Services..."
echo ""
echo "Terminal 1: Backend Server"
echo "Terminal 2: Expo Dev Server (this will open)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend in background
echo "Starting backend server..."
npm run server:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server is running on http://localhost:5000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo ""
echo "Starting Expo dev server..."
echo "Scan the QR code with Expo Go app on your phone"
echo ""

# Start Expo (this will show QR code)
npx expo start

# Keep script running
wait

#!/bin/bash

# ArtisanAI Platform Startup Script

echo "🎨 Starting ArtisanAI Platform..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running (optional - can use MongoDB Atlas)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running locally. Make sure to configure MongoDB URI in backend/.env"
    echo "   You can use MongoDB Atlas (cloud) or start local MongoDB with: mongod"
fi

# Start backend server
echo "🚀 Starting backend server..."
cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start &
BACKEND_PID=$!

cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server..."
cd frontend

# Check if Python is available for simple HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
elif command -v python &> /dev/null; then
    python -m http.server 3000 &
    FRONTEND_PID=$!
else
    echo "❌ Python is not available. Please install Python or use any HTTP server to serve the frontend directory."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo "🎉 ArtisanAI Platform is now running!"
echo "=================================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "API Docs: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
echo "📝 Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Register as an artisan to test the AI features"
echo "3. Add your Google Cloud AI API key to backend/.env"
echo "4. Configure MongoDB connection in backend/.env"
echo ""

# Wait for Ctrl+C
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
while true; do
    sleep 1
done
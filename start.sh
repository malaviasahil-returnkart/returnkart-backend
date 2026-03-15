#!/bin/bash
# ============================================================
# RETURNKART.IN — PROCESS STARTER
# Starts both the Python backend and the Vite frontend dev server.
# ============================================================

echo "🚀 Starting ReturnKart backend..."
pip install -r backend/requirements.txt -q

echo "🎨 Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..

echo "⚡ Launching both processes..."
# Start backend in background
python backend/main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Start frontend dev server
cd frontend && npm run dev

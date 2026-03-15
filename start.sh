#!/bin/bash
# RETURNKART.IN — PROCESS STARTER
# Starts Python backend + Vite frontend dev server in parallel.
echo "🚀 Starting ReturnKart backend..."
pip install -r backend/requirements.txt -q
echo "🎨 Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..
echo "⚡ Launching both processes..."
python backend/main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd frontend && npm run dev

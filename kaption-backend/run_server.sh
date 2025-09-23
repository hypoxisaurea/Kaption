#!/bin/bash

# Kaption API Server 실행 스크립트

echo "🚀 Starting Kaption API Server..."
echo "================================"

# Python 환경 확인
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    exit 1
fi

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# 환경 변수 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your GOOGLE_API_KEY"
    exit 1
fi

# API 키 확인
if ! grep -q "GOOGLE_API_KEY=" .env || grep -q "GOOGLE_API_KEY=your_gemini_api_key_here" .env; then
    echo "❌ GOOGLE_API_KEY not configured in .env"
    echo "Please add your Gemini API key to .env file"
    exit 1
fi

# 서버 실행
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo "================================"

python3 -m app.api.server
#!/bin/bash

# Kaption API 테스트 스크립트

API_URL="http://localhost:8000"

echo "🧪 Testing Kaption API"
echo "======================"

# 1. Health Check
echo -e "\n1️⃣ Health Check..."
curl -s "$API_URL/health" | python3 -m json.tool

# 2. Analyze Video - Beginner User
echo -e "\n2️⃣ Analyzing video for Beginner user..."
curl -s -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=_iQ4DBMXHpk",
    "user_profile": {
      "familiarity": 1,
      "language_level": "Beginner",
      "interests": ["K-Food", "K-Pop"]
    }
  }' | python3 -m json.tool | head -50

echo -e "\n✅ Test completed!"
echo "For full results, check the API response above."
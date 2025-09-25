# Kaption Backend API

Korean Cultural Context Analysis API for YouTube Videos

## 🎯 Overview

Kaption은 YouTube 영상에서 한국 문화 요소를 자동으로 감지하고, 사용자의 한국어 레벨과 문화 친숙도에 맞춰 맞춤형 설명을 제공하는 AI 서비스입니다

## 🚀 Quick Start for Frontend Developers

### 1. Prerequisites
- Python 3.12+
- Google Gemini API Key

### 2. Setup Environment

```bash
# Clone and navigate to backend directory
cd kaption-backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### 3. Run the Server

```bash
# Activate virtual environment (if not already activated)
source .venv/bin/activate

# Start the server
python3 -m app.api.server
```

Server will run on: **http://localhost:8000**

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "details": {
    "service": "healthy",
    "analyzer": "healthy",
    "api_key": "configured"
  }
}
```

#### 2. Analyze YouTube Video
```http
POST /api/analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "user_profile": {
    "familiarity": 3,              // 1-5 (Korean culture familiarity)
    "language_level": "Intermediate", // "Beginner" | "Intermediate" | "Advanced"
    "interests": ["k-pop", "food"]    // User's interests (slugs)
  }
}
```

**Response:**
```json
{
  "video_info": {
    "title": "Video Title in English",
    "total_duration": 360
  },
  "checkpoints": [
    {
      "timestamp_seconds": 45,
      "timestamp_formatted": "00:00:45",
      "trigger_keyword": "언니/eonni",
      "segment_stt": "언니, 이거 먹어봐요",
      "scene_description": "Younger woman offering food to older female friend",
      "context_title": "Korean Age-Based Titles",
      "explanation": {
        "summary": "언니 (eonni) is how younger females address older female friends",
        "main": "Detailed cultural explanation tailored to user level",
        "tip": "Practical usage tip"
      },
      "related_interests": ["k-drama", "language"]
    }
  ],
  "analysis_id": "unique_session_id",
  "status": "success"
}
```

#### 3. DeepDive Batch (Recap/TPS/Quiz)
```http
POST /api/deepdive/batch
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_profile": {
    "familiarity": 3,
    "language_level": "Intermediate",
    "interests": ["k-pop", "food"]
  },
  "checkpoints": [
    {
      "timestamp_seconds": 125,
      "timestamp_formatted": "02:05",
      "trigger_keyword": "형/hyung",
      "segment_stt": "정한아 형 여기 와봐요!",
      "scene_description": "Younger male calling older male friend",
      "context_title": "Korean Age Hierarchy - Hyung",
      "related_interests": ["language", "k-pop"],
      "explanation": { "summary": "", "main": "", "tip": "" }
    }
  ]
}
```

**Response (shape):**
```json
{
  "items": [
    {
      "checkpoint": {
        "timestamp_seconds": 125,
        "timestamp_formatted": "02:05",
        "trigger_keyword": "형/hyung",
        "context_title": "Korean Age Hierarchy - Hyung",
        "checkpoint_uid": "02:05|형/hyung"
      },
      "recap": {
        "compact": { "title": "...", "bullets": ["...","..."], "voiceover": "..." },
        "detailed": { "summary_short": "...", "summary_main": "...", "key_points": ["..."], "terms": [], "examples": [], "share_seed": {"claim": "...", "evidence": "...", "example": "...", "korean_term": "..."} }
      },
      "tps": {
        "think": { "prompt": "...", "guiding_questions": ["..."], "example_keywords": ["..."], "note_template": ["claim","example","korean_term","reflection"], "timebox_seconds": 30, "tts_line": "..." },
        "share": { "prompt": "...", "report_template": ["claim","evidence","example","korean_term"], "self_check": ["...","..."], "tts_line": "..." }
      },
      "quizzes": [ { "kind": "multiple_choice", "question": "...", "options": [ { "text": "..." } ], "correct_option_index": 0, "explanation": "...", "hints": ["..."] } ],
      "follow_ups": ["..."]
    }
  ]
}
```

### Error Responses

```json
{
  "status": "error",
  "error": "Error message",
  "error_code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_URL`: Invalid YouTube URL
- `ANALYSIS_ERROR`: Failed to analyze video
- `API_KEY_ERROR`: Gemini API key issue

## 🧪 Testing the API

### Using curl

```bash
# Test health check
curl http://localhost:8000/health

# Test video analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=_iQ4DBMXHpk",
    "user_profile": {
      "familiarity": 2,
      "language_level": "Beginner",
      "interests": ["k-pop", "language"]
    }
  }' | python3 -m json.tool

# Test deepdive batch
curl -X POST http://localhost:8000/api/deepdive/batch \
  -H "Content-Type: application/json" \
  -d '{
    "user_profile": {"familiarity": 3, "language_level": "Intermediate", "interests": ["k-pop","food"]},
    "checkpoints": [{
      "timestamp_seconds": 125,
      "timestamp_formatted": "02:05",
      "trigger_keyword": "형/hyung",
      "segment_stt": "정한아 형 여기 와봐요!",
      "scene_description": "Younger male calling older male friend",
      "context_title": "Korean Age Hierarchy - Hyung",
      "related_interests": ["language","k-pop"],
      "explanation": {"summary":"","main":"","tip":""}
    }]
  }' | python3 -m json.tool
```

### Using JavaScript (Frontend)

```javascript
async function analyzeVideo(youtubeUrl, userProfile) {
  const response = await fetch('http://localhost:8000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      youtube_url: youtubeUrl,
      user_profile: userProfile
    })
  });

  const data = await response.json();
  return data;
}

// Example usage
const result = await analyzeVideo(
  'https://www.youtube.com/watch?v=VIDEO_ID',
  {
    familiarity: 3,
    language_level: 'Intermediate',
    interests: ['k-pop', 'food']
  }
);
```

## 🔧 Development Tips

### CORS Configuration
The API is configured to accept requests from:
- `chrome-extension://*` - Chrome extensions
- `http://localhost:*` - Local development
- `http://localhost:5173` - Vite dev server
- `http://localhost:3000` - React dev server

### User Profile Guidelines

**Familiarity Levels (1-5):**
- 1: No knowledge of Korean culture
- 2: Basic awareness (knows kimchi, K-pop)
- 3: Moderate (watched K-dramas, tried Korean food)
- 4: Good understanding (lived in Korea or studied culture)
- 5: Near-native understanding

**Language Levels:**
- `beginner`: Can read Hangul, knows basic phrases
- `intermediate`: Can understand simple conversations
- `advanced`: Fluent or near-fluent

**Common Interests (slugs):**
- `k-pop`, `k-drama`, `food`, `language`, `history`, `humor`, `politics`, `beauty-fashion`

## 📊 Response Data Structure

### Checkpoint Object
Each checkpoint represents a teachable moment in the video:

```typescript
interface Checkpoint {
  timestamp_seconds: number;        // Exact time in video
  timestamp_formatted: string;      // Human-readable time
  trigger_keyword: string;          // Korean term with romanization
  segment_stt: string;             // Original Korean transcript
  scene_description: string;       // Visual context in English
  context_title: string;           // Educational title
  explanation: {
    summary: string;               // One-line summary
    main: string;                  // Detailed explanation
    tip: string;                   // Usage tip
  };
  related_interests: string[];    // Matching user interests
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # Make sure virtual environment is activated
   source .venv/bin/activate
   # Reinstall dependencies
   pip install -r requirements.txt
   ```

2. **API Key not working**
   - Ensure `.env` file exists and contains: `GOOGLE_API_KEY=your_actual_key`
   - Check API key validity in Google AI Studio

3. **CORS errors in browser**
   - Make sure your frontend URL is in the CORS allowed origins
   - For development, use `http://localhost:3000` or `http://localhost:5173`

4. **Server won't start**
   ```bash
   # Check if port 8000 is already in use
   lsof -i :8000
   # Kill the process if needed
   kill -9 <PID>
   ```
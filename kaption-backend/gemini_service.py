"""
Gemini Video Analysis Service - 최적화된 프롬프트와 interactive 콘텐츠
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
import hashlib
from datetime import datetime
import logging

from api_models import UserPreferences

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiVideoAnalyzer:
    """Gemini API를 사용한 YouTube 영상 분석기"""

    def __init__(self):
        """Initialize Gemini client"""
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")

        # FactWave와 동일한 방식으로 초기화
        self.client = genai.Client(api_key=self.api_key)
        logger.info("Gemini Video Analyzer initialized")

    def _generate_session_id(self, youtube_url: str, preferences: UserPreferences) -> str:
        """세션 ID 생성 (URL + 사용자 설정 기반)"""
        unique_str = f"{youtube_url}_{preferences.familiarity}_{preferences.language_level}"
        return hashlib.sha256(unique_str.encode()).hexdigest()[:16]

    def _build_analysis_prompt(self, preferences: UserPreferences) -> str:
        """최적화된 프롬프트 with few-shot examples"""

        # Few-shot examples - 다양한 deep_dive 타입 예시
        example_json = {
            "checkpoints": [
                {
                    "timestamp_seconds": 45,
                    "timestamp_formatted": "00:00:45",
                    "trigger_keyword": "언니/eonni",
                    "segment_stt": "언니, 이거 먹어봐요",
                    "scene_description": "Younger woman offering food to older female friend",
                    "context_title": "Korean Age-Based Titles",
                    "explanation": {
                        "summary": "언니 (eonni) is how younger females address older female friends or sisters",
                        "main": "In Korea, age determines how you address someone. 언니 (eonni) shows respect and closeness between females. Males use 누나 (noona) for older females, 형 (hyung) for older males.",
                        "tip": "Never call someone older by just their name unless they explicitly allow it!"
                    },
                    "deep_dive": {
                        "type": "cultural_etiquette",
                        "reason": "Age-based titles are fundamental to Korean social structure"
                    },
                    "related_interests": ["K-Drama", "Social Culture"]
                },
                {
                    "timestamp_seconds": 120,
                    "timestamp_formatted": "00:02:00",
                    "trigger_keyword": "존댓말/jondaetmal",
                    "segment_stt": "선생님, 질문 있습니다",
                    "scene_description": "Student raising hand to ask teacher a question",
                    "context_title": "Formal Speech in Korean",
                    "explanation": {
                        "summary": "존댓말 (jondaetmal) is formal speech showing respect to elders or authority",
                        "main": "Korean has complex honorific levels. 존댓말 uses -습니다/-습니까 endings for formal situations. 반말 (informal) is only for close friends of same age or younger.",
                        "tip": "When in doubt, use 존댓말 - being too formal is better than being rude!"
                    },
                    "deep_dive": {
                        "type": "language_practice",
                        "reason": "Honorific levels are crucial for appropriate communication in Korean"
                    },
                    "related_interests": ["Language Learning", "Business Korean"]
                },
                {
                    "timestamp_seconds": 180,
                    "timestamp_formatted": "00:03:00",
                    "trigger_keyword": "김치/kimchi",
                    "segment_stt": "김치 없으면 못 먹어요",
                    "scene_description": "Person reaching for kimchi dish at restaurant table",
                    "context_title": "Kimchi in Every Korean Meal",
                    "explanation": {
                        "summary": "Kimchi is the essential side dish present at virtually every Korean meal",
                        "main": "More than just fermented cabbage, kimchi represents Korean identity. There are over 200 varieties, and Koreans eat it with everything - even pizza and pasta!",
                        "tip": "If served kimchi at someone's home, complimenting it is the highest praise!"
                    },
                    "deep_dive": {
                        "type": "food_culture",
                        "reason": "Kimchi is central to Korean identity and dining culture"
                    },
                    "related_interests": ["K-Food", "Traditional Culture"]
                },
                {
                    "timestamp_seconds": 240,
                    "timestamp_formatted": "00:04:00",
                    "trigger_keyword": "화이팅/hwaiting",
                    "segment_stt": "화이팅! 우리가 해낼 수 있어!",
                    "scene_description": "Team members cheering before a competition",
                    "context_title": "Korean Fighting Spirit",
                    "explanation": {
                        "summary": "화이팅 (hwaiting/fighting) is the Korean cheer meaning 'you can do it!'",
                        "main": "Derived from English 'fighting,' it's uniquely Korean encouragement used everywhere - from exams to sports to daily challenges. Often accompanied by a fist pump!",
                        "tip": "Add someone's name before 화이팅 for personal encouragement: '민지 화이팅!'"
                    },
                    "deep_dive": {
                        "type": "social_situation",
                        "reason": "Understanding encouragement culture helps build connections in Korea"
                    },
                    "related_interests": ["K-Pop", "Student Culture"]
                },
                {
                    "timestamp_seconds": 300,
                    "timestamp_formatted": "00:05:00",
                    "trigger_keyword": "대박/daebak",
                    "segment_stt": "대박! 이게 진짜야?",
                    "scene_description": "Person reacting with surprise to unexpected news",
                    "context_title": "Korean Exclamations",
                    "explanation": {
                        "summary": "대박 (daebak) means 'awesome' or 'unbelievable' - Korea's favorite exclamation",
                        "main": "Originally meaning 'big win' in gambling, 대박 evolved into an all-purpose expression of surprise, amazement, or shock. Can be positive or negative depending on tone.",
                        "tip": "Stretch it out for emphasis: 대~~~~~~박! The longer, the more amazed you are!"
                    },
                    "deep_dive": {
                        "type": "pop_culture",
                        "reason": "Fan reaction words are essential for K-pop community engagement"
                    },
                    "related_interests": ["K-Pop", "Youth Culture"]
                }
            ],
            "video_info": {
                "title": "Understanding Korean Culture",
                "total_duration": 360
            }
        }

        prompt = f"""Analyze this YouTube video for Korean culture and language learning.

USER PROFILE:
- Familiarity: {preferences.familiarity}/5
- Level: {preferences.language_level}
- Interests: {', '.join(preferences.interests)}

TASK: Find 3-7 Korean culture/language learning moments.

EXAMPLE OUTPUT FORMAT:
{json.dumps(example_json, ensure_ascii=False, indent=2)}

REQUIREMENTS FOR EACH CHECKPOINT:
1. timestamp_seconds: exact time in seconds
2. trigger_keyword: Korean word/phrase with romanization (format: 한글/romanization)
3. segment_stt: actual subtitle/transcript at that moment
4. scene_description: what's happening visually
5. context_title: catchy educational title
6. explanation:
   - summary: 1 line overview
   - main: 2-3 lines detailed explanation with cultural context
   - tip: practical usage tip for the user's level
7. deep_dive:
   - type: choose ONE from the list below based on the content
   - reason: brief explanation why this type fits best (1 line)
8. related_interests: match user's interests when relevant

DEEP DIVE TYPE SELECTION:
Choose the MOST APPROPRIATE type for each checkpoint:
- "cultural_etiquette": Korean social norms, hierarchy, respect (bowing, age titles, formal behavior)
- "social_situation": Real-life scenarios (workplace, school, gatherings, dating, business)
- "language_practice": Grammar patterns, pronunciation, vocabulary usage
- "food_culture": Dining etiquette, Korean dishes, drinking culture
- "pop_culture": K-pop, K-drama, entertainment, youth trends, social media
- "traditional_culture": Historical customs, festivals, traditional arts

TYPE SELECTION GUIDELINES:
- Analyze the PRIMARY learning opportunity in each scene
- Consider the user's interests: {', '.join(preferences.interests)}
- Match difficulty to user level: {preferences.language_level}
- Prioritize cultural learning for low familiarity users
- Focus on language patterns for high familiarity users

QUALITY STANDARDS:
- Each checkpoint must be a REAL teachable moment from the video
- Timestamps must be accurate to the actual scene
- Korean terms must include proper romanization
- Explanations must be culturally accurate and educational
- Deep_dive type must logically match the content

OUTPUT FORMAT:
- Return ONLY valid JSON, no markdown, no code blocks
- Start with { and end with }
- Include video_info with title and total_duration
- Include 3-7 meaningful checkpoints
- Focus on moments most relevant to user's interests: {', '.join(preferences.interests)}"""

        return prompt

    async def analyze_video(
        self,
        youtube_url: str,
        preferences: UserPreferences
    ) -> Dict[str, Any]:
        """
        YouTube 영상 분석 수행

        Args:
            youtube_url: YouTube 영상 URL
            preferences: 사용자 선호도

        Returns:
            분석 결과 딕셔너리
        """
        try:
            logger.info(f"Starting analysis of: {youtube_url}")
            logger.info(f"User preferences: Level={preferences.language_level}, Familiarity={preferences.familiarity}")

            # 프롬프트 생성
            prompt = self._build_analysis_prompt(preferences)

            # Gemini API 호출 - FactWave 방식과 동일하게
            logger.info("Calling Gemini API...")
            response = self.client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=types.Content(
                    parts=[
                        types.Part(
                            file_data=types.FileData(file_uri=youtube_url)
                        ),
                        types.Part(text=prompt)
                    ]
                )
            )

            # 응답 파싱
            result_text = response.text
            logger.info("Received response from Gemini")

            # JSON 추출 (Gemini 응답에서 JSON 부분만 파싱)
            try:
                # JSON 블록 찾기
                json_start = result_text.find('{')
                json_end = result_text.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = result_text[json_start:json_end]
                    analysis_data = json.loads(json_str)
                else:
                    # 전체 텍스트를 JSON으로 시도
                    analysis_data = json.loads(result_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from Gemini response: {e}")
                logger.error(f"Response text: {result_text[:500]}...")
                # Fallback: 기본 구조 반환
                analysis_data = self._create_fallback_response(youtube_url, preferences)

            # 세션 ID 생성
            session_id = self._generate_session_id(youtube_url, preferences)

            # 체크포인트 후처리
            checkpoints = analysis_data.get('checkpoints', [])
            for checkpoint in checkpoints:
                # 시간 포맷 추가
                if 'timestamp_seconds' in checkpoint and 'timestamp_formatted' not in checkpoint:
                    seconds = checkpoint['timestamp_seconds']
                    checkpoint['timestamp_formatted'] = f"{int(seconds//60):02d}:{int(seconds%60):02d}"

                # deep_dive가 없으면 기본 구조 추가
                if 'deep_dive' not in checkpoint:
                    checkpoint['deep_dive'] = self._generate_default_deep_dive(checkpoint, preferences)

                # adapted_for_level 플래그 추가
                checkpoint['adapted_for_level'] = True

            # analysis_id 추가 (Chrome Extension 호환성)
            if 'analysis_id' not in analysis_data:
                analysis_data['analysis_id'] = session_id

            return {
                "session_id": session_id,
                "analysis_data": analysis_data,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Error analyzing video: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "error_code": "ANALYSIS_ERROR"
            }

    def _generate_default_deep_dive(self, checkpoint: Dict, preferences: UserPreferences) -> Dict:
        """기본 deep_dive 콘텐츠 생성"""
        keyword = checkpoint.get('trigger_keyword', '').split('/')[0]

        # 사용자 레벨에 따른 기본 콘텐츠
        if preferences.language_level == "beginner":
            return {
                "type": "basic_practice",
                "title": f"Learn: {keyword}",
                "content": {
                    "quiz": {
                        "question": f"What does '{keyword}' mean?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct": 0,
                        "explanation": "Basic explanation for beginners"
                    },
                    "practice": {
                        "instruction": f"Repeat after me: {keyword}",
                        "tip": "Take it slow and focus on each syllable"
                    }
                }
            }
        else:
            return {
                "type": "advanced_practice",
                "title": f"Master: {keyword}",
                "content": {
                    "quiz": {
                        "question": f"In which formal situation would you use '{keyword}'?",
                        "options": [
                            "Business meeting",
                            "Casual conversation",
                            "Written communication",
                            "All of the above"
                        ],
                        "correct": 0,
                        "explanation": "Context-specific usage explanation"
                    },
                    "grammar": {
                        "pattern": f"{keyword} + 을/를 + verb",
                        "examples": ["Example sentence 1", "Example sentence 2"]
                    }
                }
            }

    def _create_fallback_response(self, youtube_url: str, preferences: UserPreferences) -> Dict:
        """분석 실패 시 기본 응답 생성"""
        return {
            "video_info": {
                "title": "Video Analysis Pending",
                "total_duration": 0
            },
            "checkpoints": [],
            "analysis_id": self._generate_session_id(youtube_url, preferences),
            "status": "pending",
            "error": "Analysis failed - please try again"
        }

    async def extract_metadata_only(self, youtube_url: str) -> Dict[str, Any]:
        """영상 메타데이터만 빠르게 추출"""
        try:
            prompt = """
            Extract basic metadata from this video and return as JSON:
            {
                "title": "video title",
                "duration": seconds,
                "primary_language": "detected language",
                "has_korean_audio": true/false,
                "has_korean_subtitles": true/false
            }
            """

            response = self.client.models.generate_content(
                model='models/gemini-2.0-flash-exp',
                contents=types.Content(
                    parts=[
                        types.Part(file_data=types.FileData(file_uri=youtube_url)),
                        types.Part(text=prompt)
                    ]
                )
            )

            # JSON 파싱
            result_text = response.text
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1

            if json_start != -1 and json_end > 0:
                metadata = json.loads(result_text[json_start:json_end])
            else:
                metadata = json.loads(result_text)

            return {"status": "success", "metadata": metadata}

        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {"status": "error", "error": str(e)}


class CheckpointProcessor:
    """체크포인트 후처리 및 개선"""

    @staticmethod
    def enhance_checkpoints(
        checkpoints: List[Dict],
        preferences: UserPreferences
    ) -> List[Dict]:
        """체크포인트 개선 및 사용자 맞춤화"""

        enhanced = []
        for cp in checkpoints:
            # 난이도 조정
            if preferences.language_level == "beginner":
                cp = CheckpointProcessor._simplify_checkpoint(cp)
            elif preferences.language_level == "advanced":
                cp = CheckpointProcessor._enrich_checkpoint(cp)

            # 관심사 강조
            if any(interest in str(cp).lower() for interest in preferences.interests):
                cp['priority'] = 'high'
            else:
                cp['priority'] = 'normal'

            enhanced.append(cp)

        # 시간순 정렬
        enhanced.sort(key=lambda x: x.get('timestamp_seconds', 0))

        return enhanced

    @staticmethod
    def _simplify_checkpoint(checkpoint: Dict) -> Dict:
        """초급자용 단순화"""
        if 'explanation' in checkpoint and 'main' in checkpoint['explanation']:
            # 복잡한 설명 단순화
            main_text = checkpoint['explanation']['main']
            if len(main_text) > 100:
                checkpoint['explanation']['main'] = main_text[:100] + "..."

        return checkpoint

    @staticmethod
    def _enrich_checkpoint(checkpoint: Dict) -> Dict:
        """상급자용 심화"""
        # deep_dive에 추가 콘텐츠
        if 'deep_dive' in checkpoint and 'content' in checkpoint['deep_dive']:
            checkpoint['deep_dive']['content']['advanced_tip'] = \
                "Explore cultural nuances and advanced usage patterns"

        return checkpoint


# 테스트용 코드
if __name__ == "__main__":
    async def test_analyzer():
        # 환경 변수 확인
        if not os.getenv('GOOGLE_API_KEY'):
            print("Please set GOOGLE_API_KEY environment variable")
            return

        analyzer = GeminiVideoAnalyzer()

        # 테스트 설정
        test_url = "https://www.youtube.com/watch?v=_iQ4DBMXHpk"  # SEVENTEEN Going Seventeen
        test_preferences = UserPreferences(
            familiarity=3,
            language_level="intermediate",
            interests=["k-pop", "culture"]
        )

        print("Starting video analysis...")
        result = await analyzer.analyze_video(test_url, test_preferences)

        if result["status"] == "success":
            print(f"Session ID: {result['session_id']}")
            print(f"Checkpoints found: {len(result['analysis_data'].get('checkpoints', []))}")
            print(json.dumps(result['analysis_data'], indent=2, ensure_ascii=False))
        else:
            print(f"Error: {result['error']}")

    # 실행
    asyncio.run(test_analyzer())
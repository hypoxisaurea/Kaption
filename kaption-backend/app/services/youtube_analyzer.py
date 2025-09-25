"""Kaption YouTube Cultural Analyzer - Gemini API를 사용한 한국 문화 맥락 분석"""

import os
import re
import json
import logging
from typing import Optional, Dict, Any, List

# New Google GenAI client (preferred)
try:
    from google import genai as genai_client
    from google.genai import types as genai_types
    HAS_GENAI_CLIENT = True
except Exception:
    HAS_GENAI_CLIENT = False

# Legacy Generative AI SDK (fallback)
import google.generativeai as legacy_genai
from google.generativeai.types import GenerationConfig as LegacyGenerationConfig

from app.models.schemas import (
    UserProfile, VideoInfo, CulturalCheckpoint,
    Explanation, AnalyzeResponse, DeepDive,
    DeepDiveGenerateResponse, DeepDiveSection, DeepDiveExercise, ExerciseItem, CheckpointRef
)
from app.core.prompts import get_cultural_analysis_prompt

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class YouTubeCulturalAnalyzer:
    """Gemini API를 사용한 YouTube 영상 한국 문화 맥락 분석기"""

    def __init__(self):
        """Initialize Gemini API client"""
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")

        # Initialize preferred google.genai client; set up legacy fallback
        if HAS_GENAI_CLIENT:
            self.client = genai_client.Client(api_key=self.api_key)
            logger.info("Initialized google.genai Client for cultural context analysis")
        else:
            legacy_genai.configure(api_key=self.api_key)
            self.client = None
            logger.info("Initialized legacy google.generativeai configuration (fallback mode)")

    def extract_video_id(self, url: str) -> Optional[str]:
        """YouTube URL에서 video ID 추출"""
        patterns = [
            r'(?:v=|\/videos\/|embed\/|youtu.be\/|\/v\/|\/e\/|watch\?v=|watch\?.+&v=)([^#\&\?\/\s]{11})',
            r'(?:youtube\.com\/watch\?.*v=)([^#\&\?\/\s]{11})',
            r'(?:youtu\.be\/)([^#\&\?\/\s]{11})'
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def format_timestamp(self, seconds: int) -> str:
        """초를 HH:MM:SS 형식으로 변환"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60

        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes:02d}:{secs:02d}"

    def _get_response_schema(self):
        """Get structured output schema for Gemini API"""
        return {
            "type": "object",
            "properties": {
                "video_info": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "total_duration": {"type": "number"}
                    },
                    "required": ["title", "total_duration"]
                },
                "checkpoints": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "timestamp_seconds": {"type": "integer"},
                            "timestamp_formatted": {"type": "string"},
                            "trigger_keyword": {"type": "string"},
                            "segment_stt": {"type": "string"},
                            "scene_description": {"type": "string"},
                            "context_title": {"type": "string"},
                            "explanation": {
                                "type": "object",
                                "properties": {
                                    "summary": {"type": "string"},
                                    "main": {"type": "string"},
                                    "tip": {"type": "string"}
                                },
                                "required": ["summary", "main", "tip"]
                            },
                            "related_interests": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "deep_dive": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "string",
                                        "enum": [
                                            "cultural_etiquette",
                                            "social_situation",
                                            "language_practice",
                                            "food_culture",
                                            "pop_culture",
                                            "traditional_culture"
                                        ]
                                    },
                                    "reason": {"type": "string"}
                                },
                                "required": ["type", "reason"]
                            }
                        },
                        "required": [
                            "timestamp_seconds", "timestamp_formatted", "trigger_keyword",
                            "segment_stt", "scene_description", "context_title",
                            "explanation", "related_interests", "deep_dive"
                        ]
                    }
                }
            },
            "required": ["video_info", "checkpoints"]
        }

    async def analyze_video(
        self,
        youtube_url: str,
        user_profile: UserProfile
    ) -> AnalyzeResponse:
        """
        YouTube 영상의 한국 문화 맥락 분석

        Args:
            youtube_url: YouTube 영상 URL
            user_profile: 사용자 프로필 (친숙도, 언어 수준, 관심사)

        Returns:
            문화 맥락 체크포인트가 포함된 분석 결과
        """
        try:
            logger.info(f"Analyzing YouTube video for cultural context: {youtube_url}")
            logger.info(f"User profile - Familiarity: {user_profile.familiarity}, "
                       f"Language: {user_profile.language_level}, "
                       f"Interests: {user_profile.interests}")

            # 비디오 ID 추출
            video_id = self.extract_video_id(youtube_url)
            if not video_id:
                return AnalyzeResponse(
                    video_info=VideoInfo(title="Unknown", total_duration=0),
                    checkpoints=[],
                    status="error",
                    error="Invalid YouTube URL"
                )

            # 사용자 프로필 기반 프롬프트 생성
            prompt = get_cultural_analysis_prompt(user_profile.dict())

            logger.info("Calling Gemini API with structured output...")

            # Preferred path: google.genai with file_data(file_uri=YouTube URL)
            if HAS_GENAI_CLIENT and self.client is not None:
                logger.info(f"Processing YouTube URL via google.genai file_data: {youtube_url}")
                # Extend response schema to include optional deep_dive
                base_schema = self._get_response_schema()
                schema = base_schema

                config = genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                )

                contents = genai_types.Content(
                    parts=[
                        genai_types.Part(
                            file_data=genai_types.FileData(file_uri=youtube_url)
                        ),
                        genai_types.Part(text=prompt),
                    ]
                )

                response = self.client.models.generate_content(
                    model="models/gemini-2.5-flash",
                    contents=contents,
                    config=config,
                )
            else:
                # Fallback: legacy google.generativeai (may be less reliable for URL ingestion)
                logger.info(f"Processing YouTube URL via legacy SDK as plain content: {youtube_url}")
                model = legacy_genai.GenerativeModel(
                    'gemini-2.5-flash',
                    generation_config=LegacyGenerationConfig(
                        response_mime_type="application/json",
                        response_schema=self._get_response_schema()
                    )
                )
                response = model.generate_content([youtube_url, prompt])

            # 응답 파싱 - structured output이므로 직접 JSON으로 파싱 가능
            try:
                # Structured output은 이미 JSON 형식으로 반환됨
                result_text = response.text
                logger.info(f"Received structured response length: {len(result_text)} characters")

                # JSON 파싱
                result_data = json.loads(result_text)
                logger.info(f"Parsed JSON response successfully")
                logger.debug(f"Response data keys: {list(result_data.keys())}")

                # 응답 데이터 검증 및 변환
                video_info_data = result_data.get('video_info', {})
                logger.debug(f"Video info data: {video_info_data}")

                # total_duration을 float로 처리
                total_duration = float(video_info_data.get('total_duration', 0))

                video_info = VideoInfo(
                    title=video_info_data.get('title', 'Unknown'),
                    total_duration=total_duration
                )

                checkpoints = []
                for cp_data in result_data.get('checkpoints', []):
                    try:
                        # 타임스탬프 포맷팅
                        timestamp_seconds = cp_data.get('timestamp_seconds', 0)
                        timestamp_formatted = cp_data.get('timestamp_formatted',
                                                         self.format_timestamp(timestamp_seconds))

                        # Explanation 객체 생성
                        explanation = Explanation(
                            summary=cp_data.get('explanation', {}).get('summary', ''),
                            main=cp_data.get('explanation', {}).get('main', ''),
                            tip=cp_data.get('explanation', {}).get('tip', '')
                        )

                        # Deep dive (optional)
                        deep_dive_obj = None
                        dd = cp_data.get('deep_dive')
                        if isinstance(dd, dict):
                            dd_type = dd.get('type')
                            dd_reason = dd.get('reason')
                            if isinstance(dd_type, str) and isinstance(dd_reason, str):
                                try:
                                    deep_dive_obj = DeepDive(type=dd_type, reason=dd_reason)
                                except Exception as _:
                                    deep_dive_obj = None
                        # If still missing, attempt lightweight heuristic assignment
                        if deep_dive_obj is None:
                            text_blob = " ".join(filter(None, [
                                cp_data.get('context_title', ''),
                                cp_data.get('segment_stt', ''),
                                cp_data.get('scene_description', ''),
                                cp_data.get('explanation', {}).get('summary', ''),
                                cp_data.get('explanation', {}).get('main', ''),
                            ])).lower()
                            dd_type_guess = "cultural_etiquette"
                            if any(k in text_blob for k in ["grammar", "pattern", "pronunciation", "존댓말", "반말", "language"]):
                                dd_type_guess = "language_practice"
                            elif any(k in text_blob for k in ["food", "eat", "dining", "회식", "술", "식사", "밥"]):
                                dd_type_guess = "food_culture"
                            elif any(k in text_blob for k in ["k-pop", "idol", "maknae", "막내", "drama", "예능", "pop"]):
                                dd_type_guess = "pop_culture"
                            elif any(k in text_blob for k in ["tradition", "traditional", "명절", "제사", "한복"]):
                                dd_type_guess = "traditional_culture"
                            elif any(k in text_blob for k in ["senior", "junior", "선배", "후배", "직장", "학교", "상사", "사회"]):
                                dd_type_guess = "social_situation"
                            deep_dive_obj = DeepDive(
                                type=dd_type_guess,
                                reason=f"Auto-assigned based on checkpoint context: {cp_data.get('context_title', 'context')}"
                            )

                        # CulturalCheckpoint 객체 생성
                        checkpoint = CulturalCheckpoint(
                            timestamp_seconds=timestamp_seconds,
                            timestamp_formatted=timestamp_formatted,
                            trigger_keyword=cp_data.get('trigger_keyword', ''),
                            segment_stt=cp_data.get('segment_stt', ''),
                            scene_description=cp_data.get('scene_description', ''),
                            context_title=cp_data.get('context_title', ''),
                            explanation=explanation,
                            related_interests=cp_data.get('related_interests', []),
                            deep_dive=None,
                        )
                        checkpoints.append(checkpoint)
                    except Exception as e:
                        logger.warning(f"Error parsing checkpoint: {e}")
                        continue

                logger.info(f"Successfully analyzed video with {len(checkpoints)} cultural checkpoints")

                return AnalyzeResponse(
                    video_info=video_info,
                    checkpoints=checkpoints,
                    analysis_id=video_id,
                    status="success"
                )

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse structured JSON response: {e}")
                logger.error(f"Raw response: {response.text[:500]}...")
                # Structured output에서는 JSON 파싱 실패가 드물지만, fallback 제공
                return AnalyzeResponse(
                    video_info=VideoInfo(title="Parse Error", total_duration=0),
                    checkpoints=[],
                    status="error",
                    error=f"Failed to parse API response: {str(e)}"
                )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error analyzing video: {error_msg}")

            # 에러 유형 파악
            if "API key" in error_msg:
                error_detail = "Gemini API key not configured properly"
            elif "quota" in error_msg.lower():
                error_detail = "API quota exceeded. Please try again later"
            elif "not found" in error_msg.lower():
                error_detail = "Video not found or is private"
            else:
                error_detail = error_msg

            return AnalyzeResponse(
                video_info=VideoInfo(title="Error", total_duration=0),
                checkpoints=[],
                status="error",
                error=error_detail
            )

    def _create_fallback_response(self, raw_text: str, video_id: str) -> AnalyzeResponse:
        """
        JSON 파싱 실패 시 텍스트에서 기본 정보 추출

        Args:
            raw_text: Gemini 원본 응답 텍스트
            video_id: YouTube 비디오 ID

        Returns:
            기본 구조의 응답
        """
        logger.info("Creating fallback response from raw text")

        # 간단한 패턴 매칭으로 기본 정보 추출 시도
        checkpoints = []

        # 타임스탬프 패턴 찾기 (예: 00:01:23, 1:23, etc.)
        timestamp_pattern = r'(\d{1,2}:\d{2}(?::\d{2})?)'
        matches = re.findall(timestamp_pattern, raw_text)

        for i, timestamp in enumerate(matches[:5]):  # 최대 5개까지
            # 타임스탬프를 초로 변환
            parts = timestamp.split(':')
            if len(parts) == 3:
                seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:
                seconds = int(parts[0]) * 60 + int(parts[1])
            else:
                continue

            checkpoint = CulturalCheckpoint(
                timestamp_seconds=seconds,
                timestamp_formatted=timestamp,
                trigger_keyword="문화 요소",
                segment_stt="자동 추출된 내용",
                scene_description="장면 설명을 가져올 수 없습니다",
                context_title=f"문화 포인트 {i+1}",
                explanation=Explanation(
                    summary="상세 분석을 위해 다시 시도해주세요",
                    main="Gemini API 응답을 완전히 파싱할 수 없었습니다",
                    tip="잠시 후 다시 시도해주세요"
                ),
                related_interests=[]
            )
            checkpoints.append(checkpoint)

        return AnalyzeResponse(
            video_info=VideoInfo(
                title="분석 부분 완료",
                total_duration=0
            ),
            checkpoints=checkpoints,
            analysis_id=video_id,
            status="partial",
            error="응답 파싱 중 일부 오류가 발생했습니다"
        )

    async def get_video_transcript(self, youtube_url: str) -> Optional[str]:
        """
        YouTube 영상의 자막/트랜스크립트 추출

        Args:
            youtube_url: YouTube 영상 URL

        Returns:
            영상 트랜스크립트 텍스트
        """
        try:
            prompt = """이 YouTube 영상의 전체 대사와 나레이션을 시간 순서대로 추출해주세요.
            각 발언에 대해 타임스탬프를 포함해주세요.

            형식:
            [00:00:00] 발언 내용
            [00:00:10] 다음 발언 내용
            """

            logger.info(f"Extracting transcript from YouTube URL: {youtube_url}")

            if HAS_GENAI_CLIENT and getattr(self, 'client', None) is not None:
                contents = genai_types.Content(
                    parts=[
                        genai_types.Part(
                            file_data=genai_types.FileData(file_uri=youtube_url)
                        ),
                        genai_types.Part(text=prompt),
                    ]
                )
                response = self.client.models.generate_content(
                    model="models/gemini-2.5-flash",
                    contents=contents,
                )
            else:
                # Legacy fallback
                model = legacy_genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content([youtube_url, prompt])

            return response.text

        except Exception as e:
            logger.error(f"Error extracting transcript: {e}")
            return None


    async def generate_deep_dive_content(
        self,
        checkpoint: CulturalCheckpoint,
        user_profile: UserProfile,
    ) -> DeepDiveGenerateResponse:
        """Use Gemini to generate rich deep-dive tutoring content based on a checkpoint"""
        # Build structured schema according to DeepDiveGenerateResponse
        schema = {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": [
                        "cultural_etiquette",
                        "social_situation",
                        "language_practice",
                        "food_culture",
                        "pop_culture",
                        "traditional_culture",
                    ],
                },
                "checkpoint": {
                    "type": "object",
                    "properties": {
                        "timestamp_seconds": {"type": "integer"},
                        "timestamp_formatted": {"type": "string"},
                        "trigger_keyword": {"type": "string"},
                        "context_title": {"type": "string"},
                    },
                    "required": ["timestamp_seconds", "timestamp_formatted", "trigger_keyword", "context_title"],
                },
                "title": {"type": "string"},
                "summary": {"type": "string"},
                "learning_objectives": {"type": "array", "items": {"type": "string"}},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "heading": {"type": "string"},
                            "detail": {"type": "string"},
                        },
                        "required": ["heading", "detail"],
                    },
                },
                "exercises": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "kind": {"type": "string", "enum": ["quiz", "roleplay", "practice"]},
                            "prompt": {"type": "string"},
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "question": {"type": ["string", "null"]},
                                        "options": {"type": ["array", "null"], "items": {"type": "string"}},
                                        "answer": {"type": ["string", "null"]},
                                        "explanation": {"type": ["string", "null"]},
                                        "scenario": {"type": ["string", "null"]},
                                        "dialogue": {"type": ["array", "null"], "items": {"type": "string"}},
                                        "tips": {"type": ["array", "null"], "items": {"type": "string"}},
                                        "pattern": {"type": ["string", "null"]},
                                        "examples": {"type": ["array", "null"], "items": {"type": "string"}},
                                        "task": {"type": ["string", "null"]},
                                    },
                                },
                            },
                        },
                        "required": ["kind", "prompt", "items"],
                    },
                },
                "resources": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["type", "checkpoint", "title", "summary", "learning_objectives", "sections", "exercises", "resources"],
        }

        # Build prompt using checkpoint and user profile
        level = user_profile.language_level
        familiarity = user_profile.familiarity
        interests = ", ".join(user_profile.interests) if user_profile.interests else "general"
        dd_type = checkpoint.deep_dive.type

        system_prompt = f"""
You are a helpful Korean culture tutor. Create interactive deep-dive learning content for a given checkpoint.
Requirements:
- Output valid JSON only.
- Tailor depth to familiarity {familiarity}/5 and language level {level}.
- Align examples with interests: {interests}.
- Deep-dive type: {dd_type}.
- Provide concrete, actionable, and culturally accurate content.
"""

        checkpoint_brief = {
            "timestamp_seconds": checkpoint.timestamp_seconds,
            "timestamp_formatted": checkpoint.timestamp_formatted,
            "trigger_keyword": checkpoint.trigger_keyword,
            "context_title": checkpoint.context_title,
        }

        # Preferred client path
        if HAS_GENAI_CLIENT and self.client is not None:
            config = genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            )
            contents = genai_types.Content(
                parts=[
                    genai_types.Part(text=json.dumps({
                        "system": system_prompt,
                        "checkpoint": checkpoint_brief,
                        "explanation": checkpoint.explanation.dict(),
                        "scene_description": checkpoint.scene_description,
                        "segment_stt": checkpoint.segment_stt,
                    }))
                ]
            )
            resp = self.client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=contents,
                config=config,
            )
            data = json.loads(resp.text)
        else:
            # Fallback legacy
            model = legacy_genai.GenerativeModel('gemini-2.5-flash',
                generation_config=LegacyGenerationConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                )
            )
            resp = model.generate_content([
                json.dumps({
                    "system": system_prompt,
                    "checkpoint": checkpoint_brief,
                    "explanation": checkpoint.explanation.dict(),
                    "scene_description": checkpoint.scene_description,
                    "segment_stt": checkpoint.segment_stt,
                })
            ])
            data = json.loads(resp.text)

        # Map to Pydantic response
        return DeepDiveGenerateResponse(
            type=data["type"],
            checkpoint=CheckpointRef(**data["checkpoint"]),
            title=data["title"],
            summary=data["summary"],
            learning_objectives=data.get("learning_objectives", []),
            sections=[DeepDiveSection(**s) for s in data.get("sections", [])],
            exercises=[
                DeepDiveExercise(
                    kind=e["kind"],
                    prompt=e["prompt"],
                    items=[ExerciseItem(**it) for it in e.get("items", [])]
                ) for e in data.get("exercises", [])
            ],
            resources=data.get("resources", []),
        )
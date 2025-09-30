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
    Explanation, AnalyzeResponse,
    DeepDiveGenerateResponse, DeepDiveSection, DeepDiveExercise, ExerciseItem, CheckpointRef,
    DeepDiveBatchRequest, DeepDiveBatchResponse, DeepDiveItem, QuizItem, QuizOption, TPSActivity, TPSThink, TPSShare, Recap, RecapCompact, RecapDetailed
)
from app.core.prompts import get_cultural_analysis_prompt, get_deepdive_batch_prompt
from app.services.rag import CultureRAG

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class YouTubeCulturalAnalyzer:
    """Gemini API를 사용한 YouTube 영상 한국 문화 맥락 분석기"""

    def __init__(self, rag: CultureRAG | None = None):
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

        # Optional RAG index for retrieval-augmented prompts
        self.rag: CultureRAG | None = rag

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

    def _sanitize_trigger_keyword(self, value: str) -> str:
        """Normalize trigger_keyword to a single concise 'ko/rom' pair (no '&', max ~40 chars)."""
        try:
            if value is None:
                return ""
            s = str(value).replace("\n", " ").replace("\r", " ").strip().strip('\"\'')

            # Prefer the first Korean/romanization pair if present
            m = re.search(r'([가-힣][가-힣\s\-]{0,24})\s*/\s*([A-Za-z][A-Za-z\s\-]{0,24})', s)
            if m:
                ko = re.sub(r'\s{2,}', ' ', m.group(1).strip())
                rom = re.sub(r'\s{2,}', ' ', m.group(2).strip())
            else:
                # Otherwise, take the first token before separators and drop any trailing '/...'
                head = re.split(r'\s*(?:&|,|;|\band\b|\bor\b|\||·|•)\s*', s, maxsplit=1, flags=re.IGNORECASE)[0]
                head = re.sub(r'\(.*?\)|\[.*?\]', '', head).strip()
                head = head.split('/', 1)[0].strip()
                ko = head
                rom = ""

            # Keep at most two words for readability
            def _two_words(t: str) -> str:
                parts = t.split()
                return " ".join(parts[:2])
            ko = _two_words(ko)
            if rom:
                rom = _two_words(rom)

            # Remove disallowed chars (keep Korean letters, ASCII letters/digits, hyphen and space)
            ko = re.sub(r'[^가-힣A-Za-z0-9\-\s]', '', ko).strip()
            rom = re.sub(r'[^A-Za-z0-9\-\s]', '', rom).strip()

            # Length caps
            ko = ko[:24].strip()
            rom = rom[:24].strip()

            sanitized = f"{ko}/{rom}" if ko and rom else ko
            # Final guards
            sanitized = sanitized.split('&', 1)[0].strip()
            if len(sanitized) > 40:
                sanitized = sanitized[:40].rstrip()
            return sanitized
        except Exception:
            try:
                return str(value).split('&', 1)[0].split(',', 1)[0].split('/', 1)[0].strip()
            except Exception:
                return ""

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
                            "trigger_keyword": {"type": "string", "maxLength": 40, "pattern": "^[^&]{1,40}$"},
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
                            }
                        },
                        "required": [
                            "timestamp_seconds", "timestamp_formatted", "trigger_keyword",
                            "segment_stt", "scene_description", "context_title",
                            "explanation", "related_interests"
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
                schema = self._get_response_schema()

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

                        # CulturalCheckpoint 객체 생성
                        checkpoint = CulturalCheckpoint(
                            timestamp_seconds=timestamp_seconds,
                            timestamp_formatted=timestamp_formatted,
                            trigger_keyword=self._sanitize_trigger_keyword(cp_data.get('trigger_keyword', '')),
                            segment_stt=cp_data.get('segment_stt', ''),
                            scene_description=cp_data.get('scene_description', ''),
                            context_title=cp_data.get('context_title', ''),
                            explanation=explanation,
                            related_interests=cp_data.get('related_interests', []),
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

    def _get_deepdive_batch_schema(self) -> Dict[str, Any]:
        """Structured JSON schema for DeepDive batch generation."""
        return {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "properties": {
                            "checkpoint": {
                                "type": "object",
                                "properties": {
                                    "timestamp_seconds": {"type": "integer"},
                                    "timestamp_formatted": {"type": "string"},
                                    "trigger_keyword": {"type": "string", "maxLength": 40},
                                    "context_title": {"type": "string", "maxLength": 120},
                                    "checkpoint_uid": {"type": "string"}
                                },
                                "required": ["timestamp_seconds","timestamp_formatted","trigger_keyword","context_title"]
                            },
                            "recap": {
                                "type": "object",
                                "properties": {
                                    "compact": {
                                        "type": "object",
                                        "properties": {
                                            "title": {"type": "string", "maxLength": 80},
                                            "bullets": {"type": "array", "minItems": 2, "maxItems": 4, "items": {"type": "string", "maxLength": 100}},
                                            "voiceover": {"type": "string", "maxLength": 120}
                                        },
                                        "required": ["title","bullets"]
                                    },
                                    "detailed": {
                                        "type": "object",
                                        "properties": {
                                            "summary_short": {"type": "string", "maxLength": 120},
                                            "summary_main": {"type": "string", "maxLength": 320},
                                            "key_points": {"type": "array", "maxItems": 4, "items": {"type": "string", "maxLength": 100}},
                                            "terms": {"type": "array", "maxItems": 4, "items": {
                                                "type": "object",
                                                "properties": {
                                                    "term_ko": {"type": "string", "maxLength": 32},
                                                    "term_rom": {"type": "string", "maxLength": 48},
                                                    "gloss_en": {"type": "string", "maxLength": 120},
                                                    "sample_en": {"type": "string", "maxLength": 140}
                                                },
                                                "required": ["term_ko","term_rom","gloss_en"]
                                            }},
                                            "examples": {"type": "array", "maxItems": 2, "items": {
                                                "type": "object",
                                                "properties": {
                                                    "scene": {"type": "string", "maxLength": 100},
                                                    "translation_en": {"type": "string", "maxLength": 160},
                                                    "line_ko": {"type": "string", "maxLength": 80},
                                                    "line_rom": {"type": "string", "maxLength": 100}
                                                },
                                                "required": ["scene","translation_en"]
                                            }},
                                            "share_seed": {
                                                "type": "object",
                                                "properties": {
                                                    "claim": {"type": "string", "maxLength": 140},
                                                    "evidence": {"type": "string", "maxLength": 160},
                                                    "example": {"type": "string", "maxLength": 160},
                                                    "korean_term": {"type": "string", "maxLength": 60}
                                                }
                                            }
                                        },
                                        "required": ["summary_short","summary_main"]
                                    }
                                },
                                "required": ["compact","detailed"]
                            },
                            "tps": {
                                "type": "object",
                                "properties": {
                                    "think": {
                                        "type": "object",
                                        "properties": {
                                            "prompt": {"type": "string", "maxLength": 140},
                                            "guiding_questions": {"type": "array", "maxItems": 3, "items": {"type": "string", "maxLength": 120}},
                                            "example_keywords": {"type": "array", "maxItems": 4, "items": {"type": "string", "maxLength": 24}},
                                            "note_template": {"type": "array", "minItems": 2, "maxItems": 4, "items": {"type": "string", "maxLength": 24}},
                                            "timebox_seconds": {"type": "integer", "minimum": 10, "maximum": 120},
                                            "tts_line": {"type": "string", "maxLength": 120}
                                        },
                                        "required": ["prompt","timebox_seconds"]
                                    },
                                    "share": {
                                        "type": "object",
                                        "properties": {
                                            "prompt": {"type": "string", "maxLength": 140},
                                            "report_template": {"type": "array", "minItems": 3, "maxItems": 5, "items": {"type": "string", "maxLength": 24}},
                                            "self_check": {"type": "array", "minItems": 2, "maxItems": 4, "items": {"type": "string", "maxLength": 100}},
                                            "tts_line": {"type": "string", "maxLength": 120}
                                        },
                                        "required": ["prompt","report_template","self_check"]
                                    }
                                },
                                "required": ["think","share"]
                            },
                            "quizzes": {
                                "type": "array",
                                "minItems": 1,
                                "maxItems": 2,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "kind": {"type": "string", "enum": ["multiple_choice","open_ended"]},
                                        "question": {"type": "string", "maxLength": 140},
                                        "options": {"type": "array", "minItems": 0, "maxItems": 4, "items": {
                                            "type": "object",
                                            "properties": {
                                                "text": {"type": "string", "maxLength": 120}
                                            },
                                            "required": ["text"]
                                        }},
                                        "correct_option_index": {"type": "integer", "minimum": 0, "maximum": 3},
                                        "correct_answer_text": {"type": "string", "maxLength": 140},
                                        "explanation": {"type": "string", "maxLength": 180},
                                        "hints": {"type": "array", "maxItems": 2, "items": {"type": "string", "maxLength": 100}},
                                        "tags": {"type": "array", "maxItems": 5, "items": {"type": "string", "maxLength": 24}}
                                    },
                                    "required": ["kind","question","explanation"]
                                }
                            },
                            "follow_ups": {"type": "array", "maxItems": 2, "items": {"type": "string", "maxLength": 140}}
                        },
                        "required": ["checkpoint","recap","tps","quizzes"]
                    }
                }
            },
            "required": ["items"]
        }

    async def generate_deep_dive_batch(self, user_profile: UserProfile, checkpoints: List[CulturalCheckpoint]) -> DeepDiveBatchResponse:
        """Generate recap/TPS/quizzes for a list of checkpoints using structured output."""
        if not checkpoints:
            return DeepDiveBatchResponse(items=[])

        # Build prompt
        cp_payload = []
        for cp in checkpoints:
            cp_payload.append({
                "timestamp_seconds": cp.timestamp_seconds,
                "timestamp_formatted": cp.timestamp_formatted,
                "trigger_keyword": cp.trigger_keyword,
                "segment_stt": cp.segment_stt,
                "scene_description": cp.scene_description,
                "context_title": cp.context_title,
                "related_interests": cp.related_interests,
            })

        # Build optional RAG contexts per checkpoint
        rag_contexts: List[List[Dict[str, Any]]] | None = None
        try:
            if self.rag and getattr(self.rag, "loaded", False):
                rag_contexts = []
                for cp in cp_payload:
                    # Query construction uses cultural cue + title + transcript snippet
                    interests = ", ".join(user_profile.interests) if user_profile.interests else ""
                    query_parts = [
                        cp.get("trigger_keyword") or "",
                        cp.get("context_title") or "",
                        cp.get("segment_stt") or "",
                        interests,
                    ]
                    query = " \n".join([p for p in query_parts if p])
                    top = self.rag.retrieve_context(query=query, top_k=3)
                    # keep compact fields only
                    compact = [{
                        "question": t["question"],
                        "answer": t["answer"],
                        "category": t.get("category", "")
                    } for t in top]
                    rag_contexts.append(compact)
        except Exception as e:
            logger.warning(f"RAG retrieval failed, proceeding without RAG: {e}")
            rag_contexts = None

        prompt = get_deepdive_batch_prompt(user_profile.dict(), cp_payload, rag_contexts)

        # Structured output schema
        schema = self._get_deepdive_batch_schema()

        # Call Gemini
        if HAS_GENAI_CLIENT and self.client is not None:
            config = genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            )
            contents = genai_types.Content(parts=[genai_types.Part(text=prompt)])
            response = self.client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=contents,
                config=config,
            )
            text = response.text
        else:
            model = legacy_genai.GenerativeModel(
                'gemini-2.5-flash',
                generation_config=LegacyGenerationConfig(
                    response_mime_type="application/json",
                    response_schema=schema
                )
            )
            resp = model.generate_content([prompt])
            text = resp.text

        # Parse
        data = json.loads(text)

        # Pydantic validation
        result = DeepDiveBatchResponse(**data)

        # Post-process: clip/validate
        for item in result.items:
            # ensure checkpoint_uid
            if getattr(item.checkpoint, 'checkpoint_uid', None) in (None, ""):
                item.checkpoint.checkpoint_uid = f"{item.checkpoint.timestamp_formatted}|{item.checkpoint.trigger_keyword}"

            # recap limits (soft clip length in place)
            item.recap.compact.bullets = item.recap.compact.bullets[:4]
            if item.recap.detailed.examples:
                item.recap.detailed.examples = item.recap.detailed.examples[:2]
            if item.recap.detailed.terms:
                item.recap.detailed.terms = item.recap.detailed.terms[:4]
            if item.recap.detailed.key_points:
                item.recap.detailed.key_points = item.recap.detailed.key_points[:4]

            # quizzes
            fixed_quizzes: List[QuizItem] = []
            for q in item.quizzes[:2]:
                if q.kind == "multiple_choice":
                    if q.options is None:
                        continue
                    # dedupe & cap 4
                    dedup = []
                    seen = set()
                    for opt in q.options:
                        key = (opt.text or "").strip()
                        if key and key not in seen:
                            seen.add(key)
                            dedup.append(opt)
                        if len(dedup) >= 4:
                            break
                    q.options = dedup
                    # index guard
                    if q.correct_option_index is None or not (0 <= q.correct_option_index < len(q.options)):
                        # default to first if invalid
                        q.correct_option_index = 0 if q.options else None
                # hints <= 2
                q.hints = (q.hints or [])[:2]
                fixed_quizzes.append(q)
            item.quizzes = fixed_quizzes

        return result
"""
Kaption FastAPI Backend Server
한국 문화 맥락 분석 API for Chrome Extension
"""

import os
import sys
import logging
from typing import Dict, Any
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.models.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    DeepDiveGenerateRequest, DeepDiveGenerateResponse,
    CulturalCheckpoint, UserProfile
)
from app.services.youtube_analyzer import YouTubeCulturalAnalyzer

# 환경 설정
load_dotenv()
logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG") else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# UTF-8 인코딩 설정 (Windows 지원)
if os.name == 'nt':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# 전역 analyzer 인스턴스
analyzer: YouTubeCulturalAnalyzer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 생명주기 관리"""
    global analyzer

    # 시작 시
    logger.info("Initializing Kaption API Server...")

    # Gemini API 키 확인
    if not os.getenv('GOOGLE_API_KEY'):
        logger.warning("GOOGLE_API_KEY not found in environment. Please set it in .env file")

    try:
        analyzer = YouTubeCulturalAnalyzer()
        logger.info("YouTube Cultural Analyzer initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize analyzer: {e}")
        analyzer = None

    yield

    # 종료 시
    logger.info("Shutting down Kaption API Server...")


# FastAPI 앱 생성
app = FastAPI(
    title="Kaption API",
    description="Korean Cultural Context Analysis for YouTube Videos",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (Chrome Extension과 통신을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",  # Chrome Extension
        "http://localhost:*",     # 로컬 개발
        "http://127.0.0.1:*",
        "http://localhost:5173",  # Vite 개발 서버
        "http://localhost:3000",  # React 개발 서버
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """API 헬스 체크"""
    return {
        "service": "Kaption API",
        "status": "running",
        "version": "1.0.0",
        "description": "Korean Cultural Context Analysis for YouTube Videos",
        "analyzer_status": "ready" if analyzer else "not initialized"
    }


@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    status_details = {
        "service": "healthy",
        "analyzer": "healthy" if analyzer else "unhealthy",
        "api_key": "configured" if os.getenv('GOOGLE_API_KEY') else "missing"
    }

    overall_status = all(
        v == "healthy" or v == "configured"
        for v in status_details.values()
    )

    return {
        "status": "healthy" if overall_status else "degraded",
        "details": status_details
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    YouTube 영상의 한국 문화 맥락 분석

    Args:
        request: 영상 URL과 사용자 프로필 정보

    Returns:
        문화 맥락 체크포인트가 포함된 분석 결과
    """
    logger.info(f"Received analysis request for: {request.youtube_url}")
    logger.info(f"User profile: familiarity={request.user_profile.familiarity} "
                f"language_level='{request.user_profile.language_level}' "
                f"interests={request.user_profile.interests}")

    # Request ID 생성 (추적용)
    request_id = str(uuid4())[:8]
    logger.info(f"[{request_id}] Starting analysis for video")

    # Analyzer 초기화 확인
    if not analyzer:
        logger.error(f"[{request_id}] Analyzer not initialized - service unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis service is not available. Please check API configuration."
        )

    try:
        # 영상 분석 수행
        logger.info(f"[{request_id}] Calling analyzer.analyze_video...")
        result = await analyzer.analyze_video(
            youtube_url=request.youtube_url,
            user_profile=request.user_profile
        )
        logger.info(f"[{request_id}] Analyzer returned with status: {result.status}")

        # 에러 상태 확인
        if result.status == "error":
            logger.error(f"[{request_id}] Analysis failed with error: {result.error}")
            logger.error(f"[{request_id}] Error details - Status: {result.status}, Error message: {result.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error or "Failed to analyze video"
            )

        logger.info(f"[{request_id}] Analysis completed successfully")
        logger.info(f"[{request_id}] Results - Video title: {result.video_info.title}, "
                    f"Duration: {result.video_info.total_duration}s, "
                    f"Checkpoints: {len(result.checkpoints)}")

        # 첫 몇 개의 체크포인트 로깅
        if result.checkpoints:
            logger.debug(f"[{request_id}] First checkpoint: {result.checkpoints[0].context_title} "
                        f"at {result.checkpoints[0].timestamp_formatted}")

        return result

    except HTTPException as he:
        logger.warning(f"[{request_id}] HTTPException raised: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Unexpected error during analysis: {type(e).__name__}: {str(e)}")
        logger.exception(f"[{request_id}] Full exception trace:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@app.post("/api/deepdive", response_model=DeepDiveGenerateResponse)
async def generate_deepdive(content: DeepDiveGenerateRequest):
    """Generate rich deep-dive tutoring content for a given checkpoint using Gemini"""
    if not analyzer:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis service is not available"
        )

    try:
        result = await analyzer.generate_deep_dive_content(
            checkpoint=content.checkpoint,
            user_profile=content.user_profile
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"DeepDive generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate deep dive content: {str(e)}"
        )


@app.post("/api/analyze/transcript")
async def get_transcript(request: Dict[str, str]):
    """
    YouTube 영상의 트랜스크립트 추출

    Args:
        request: {"youtube_url": "URL"}

    Returns:
        영상 트랜스크립트
    """
    youtube_url = request.get("youtube_url")
    if not youtube_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="youtube_url is required"
        )

    if not analyzer:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis service is not available"
        )

    try:
        transcript = await analyzer.get_video_transcript(youtube_url)

        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not extract transcript from video"
            )

        return {
            "youtube_url": youtube_url,
            "transcript": transcript
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting transcript: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract transcript: {str(e)}"
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP 예외 처리"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """일반 예외 처리"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else None
        }
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"Starting Kaption API Server on {host}:{port}")

    uvicorn.run(
        "app.api.server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
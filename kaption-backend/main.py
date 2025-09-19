# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ✅ 분리한 서비스를 임포트
from bedrock_service import BedrockService

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoData(BaseModel):
    title: str
    description: str | None = None

# ✅ 서비스 인스턴스를 애플리케이션 시작 시점에 생성
bedrock_service = BedrockService()

@app.post("/api/summarize")
async def summarize_video(data: VideoData):
    """
    영상 정보를 받아 BedrockService를 통해 요약을 요청합니다.
    """
    if not data.title:
        raise HTTPException(status_code=400, detail="제목이 필요합니다.")

    description_to_use = data.description if data.description else data.title

    try:
        # ✅ 분리된 서비스의 메서드를 호출하여 요약 결과 받기
        summary = await bedrock_service.generate_summary(
            title=data.title, 
            description=description_to_use
        )
        return {"summary": summary}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="요약 중 내부 서버 오류가 발생했습니다.")
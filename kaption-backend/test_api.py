"""Kaption API Test Script"""

import asyncio
import json
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.models.schemas import AnalyzeRequest, UserProfile
from app.services.youtube_analyzer import YouTubeCulturalAnalyzer


async def test_analyzer():
    """YouTube Cultural Analyzer 테스트"""

    print("=" * 60)
    print("Kaption YouTube Cultural Analyzer Test")
    print("=" * 60)

    # API 키 확인
    if not os.getenv('GOOGLE_API_KEY'):
        print("\n❌ Error: GOOGLE_API_KEY not found in environment")
        print("Please create .env file and add your Gemini API key")
        return

    # Analyzer 초기화
    print("\n1. Initializing analyzer...")
    try:
        analyzer = YouTubeCulturalAnalyzer()
        print("✅ Analyzer initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return

    # Test video URLs (Korean cultural content)
    test_videos = [
        "https://www.youtube.com/watch?v=_iQ4DBMXHpk",  # SEVENTEEN GoSe (자컨)
        # Add more Korean culture video URLs here
        # Example: Korean street food, K-drama clips, variety shows
    ]

    # 테스트 사용자 프로필들
    test_profiles = [
        {
            "name": "Beginner User",
            "profile": UserProfile(
                familiarity=1,
                language_level="Beginner",
                interests=["K-Food", "K-Pop"]
            )
        },
        {
            "name": "Intermediate User",
            "profile": UserProfile(
                familiarity=3,
                language_level="Intermediate",
                interests=["Korean History", "K-Drama"]
            )
        },
        {
            "name": "Advanced User",
            "profile": UserProfile(
                familiarity=5,
                language_level="Advanced",
                interests=["Traditional Culture", "Korean Language"]
            )
        }
    ]

    # 첫 번째 비디오와 첫 번째 프로필로 테스트
    test_video = test_videos[0]
    test_profile = test_profiles[0]

    print(f"\n2. Testing with video: {test_video}")
    print(f"   User profile: {test_profile['name']}")
    print(f"   - Familiarity: {test_profile['profile'].familiarity}/5")
    print(f"   - Language Level: {test_profile['profile'].language_level}")
    print(f"   - Interests: {', '.join(test_profile['profile'].interests)}")

    print("\n3. Analyzing video...")
    try:
        result = await analyzer.analyze_video(
            youtube_url=test_video,
            user_profile=test_profile['profile']
        )

        if result.status == "success":
            print("✅ Analysis completed successfully!")

            # 결과 출력
            print(f"\n📹 Video Info:")
            print(f"   - Title: {result.video_info.title}")
            print(f"   - Duration: {result.video_info.total_duration} seconds")

            print(f"\n📌 Cultural Checkpoints Found: {len(result.checkpoints)}")

            for i, checkpoint in enumerate(result.checkpoints[:3], 1):  # 처음 3개만 출력
                print(f"\n   Checkpoint {i}:")
                print(f"   ⏰ Time: {checkpoint.timestamp_formatted}")
                print(f"   🔑 Keyword: {checkpoint.trigger_keyword}")
                print(f"   📝 Context: {checkpoint.context_title}")
                print(f"   💡 Summary: {checkpoint.explanation.summary}")
                print(f"   📚 Tip: {checkpoint.explanation.tip}")

                if checkpoint.related_interests:
                    print(f"   🎯 Related Interests: {', '.join(checkpoint.related_interests)}")

            # JSON 파일로 저장
            output_file = "test_result.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(result.dict(), f, ensure_ascii=False, indent=2)
            print(f"\n💾 Full results saved to: {output_file}")

        else:
            print(f"⚠️ Analysis completed with status: {result.status}")
            if result.error:
                print(f"   Error: {result.error}")

    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)


async def test_api_request():
    """FastAPI 엔드포인트 테스트"""
    import httpx

    print("\n" + "=" * 60)
    print("Testing FastAPI Endpoint")
    print("=" * 60)

    # API 서버가 실행 중인지 확인
    api_url = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        # Health check
        try:
            response = await client.get(f"{api_url}/health")
            print(f"\n✅ Server is running: {response.json()}")
        except Exception as e:
            print(f"\n❌ Server is not running. Please start the server first:")
            print(f"   python -m app.api.server")
            return

        # Analyze request
        request_data = {
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "user_profile": {
                "familiarity": 2,
                "language_level": "Intermediate",
                "interests": ["K-Food", "K-Drama"]
            }
        }

        print(f"\n📤 Sending analysis request...")
        print(f"   URL: {request_data['youtube_url']}")

        try:
            response = await client.post(
                f"{api_url}/api/analyze",
                json=request_data,
                timeout=60.0  # 60초 타임아웃
            )

            if response.status_code == 200:
                result = response.json()
                print(f"✅ Analysis successful!")
                print(f"   Checkpoints found: {len(result.get('checkpoints', []))}")
            else:
                print(f"❌ Request failed: {response.status_code}")
                print(f"   Error: {response.text}")

        except Exception as e:
            print(f"❌ Request failed: {e}")


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(description="Kaption API Test Script")
    parser.add_argument(
        "--mode",
        choices=["analyzer", "api", "both"],
        default="analyzer",
        help="Test mode: analyzer (direct test), api (API endpoint test), or both"
    )

    args = parser.parse_args()

    # .env 파일 로드
    from dotenv import load_dotenv
    load_dotenv()

    if args.mode in ["analyzer", "both"]:
        asyncio.run(test_analyzer())

    if args.mode in ["api", "both"]:
        asyncio.run(test_api_request())


if __name__ == "__main__":
    main()
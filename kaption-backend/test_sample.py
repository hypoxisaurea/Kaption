"""Sample test script for Kaption API with English output"""

import asyncio
import json
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.models.schemas import AnalyzeRequest, UserProfile
from app.services.youtube_analyzer import YouTubeCulturalAnalyzer


async def test_sample_video():
    """Test with a sample Korean video"""

    print("=" * 60)
    print("Kaption API Test - English Output")
    print("=" * 60)

    # Check API key
    if not os.getenv('GOOGLE_API_KEY'):
        print("\n❌ Error: GOOGLE_API_KEY not found")
        print("Please add your Gemini API key to .env file")
        return

    # Initialize analyzer
    print("\n1. Initializing Cultural Analyzer...")
    try:
        analyzer = YouTubeCulturalAnalyzer()
        print("✅ Analyzer ready")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return

    # Sample Korean video URL - SEVENTEEN GoSe
    test_video_url = "https://www.youtube.com/watch?v=_iQ4DBMXHpk"  # SEVENTEEN 자컨

    # Test profiles for different user types
    test_cases = [
        {
            "name": "Complete Beginner",
            "profile": UserProfile(
                familiarity=1,
                language_level="Beginner",
                interests=["K-Food", "K-Pop"]
            ),
            "expected": "Simple English explanations with romanized Korean terms"
        },
        {
            "name": "K-Drama Fan",
            "profile": UserProfile(
                familiarity=3,
                language_level="Intermediate",
                interests=["K-Drama", "Korean Language"]
            ),
            "expected": "Balanced English with common Korean expressions"
        },
        {
            "name": "Advanced Learner",
            "profile": UserProfile(
                familiarity=5,
                language_level="Advanced",
                interests=["Traditional Culture", "Korean History"]
            ),
            "expected": "Detailed English with advanced Korean terminology"
        }
    ]

    # Choose test case
    test_case = test_cases[0]  # Test with beginner profile

    print(f"\n2. Test Configuration:")
    print(f"   Video: {test_video_url}")
    print(f"   User Type: {test_case['name']}")
    print(f"   Expected Output: {test_case['expected']}")
    print(f"   Profile Details:")
    print(f"   - Familiarity: {test_case['profile'].familiarity}/5")
    print(f"   - Language: {test_case['profile'].language_level}")
    print(f"   - Interests: {', '.join(test_case['profile'].interests)}")

    print("\n3. Analyzing video for cultural contexts...")
    print("   (This may take 10-30 seconds)")

    try:
        result = await analyzer.analyze_video(
            youtube_url=test_video_url,
            user_profile=test_case['profile']
        )

        if result.status == "success":
            print("\n✅ Analysis Complete!")
            print("\n" + "=" * 60)
            print("ANALYSIS RESULTS")
            print("=" * 60)

            # Video information
            print(f"\n📹 Video Information:")
            print(f"   Title: {result.video_info.title}")
            print(f"   Duration: {result.video_info.total_duration}s")

            # Cultural checkpoints
            print(f"\n📌 Cultural Checkpoints Found: {len(result.checkpoints)}")

            for i, checkpoint in enumerate(result.checkpoints[:5], 1):
                print(f"\n{'─' * 50}")
                print(f"Checkpoint #{i}")
                print(f"{'─' * 50}")
                print(f"⏰ Time: {checkpoint.timestamp_formatted}")
                print(f"🎯 Korean Term: {checkpoint.trigger_keyword}")
                print(f"📍 Context: {checkpoint.context_title}")
                print(f"\n💬 What was said:")
                print(f"   \"{checkpoint.segment_stt}\"")
                print(f"\n👁️ Scene:")
                print(f"   {checkpoint.scene_description}")
                print(f"\n📝 Explanation:")
                print(f"   Summary: {checkpoint.explanation.summary}")
                print(f"   Details: {checkpoint.explanation.main}")
                print(f"   💡 Tip: {checkpoint.explanation.tip}")

                if checkpoint.related_interests:
                    print(f"\n🔗 Related to your interests: {', '.join(checkpoint.related_interests)}")

            # Save full results
            output_file = "sample_analysis_result.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(result.dict(), f, ensure_ascii=False, indent=2)
            print(f"\n💾 Full results saved to: {output_file}")

        else:
            print(f"\n⚠️ Analysis status: {result.status}")
            if result.error:
                print(f"   Error: {result.error}")

    except Exception as e:
        print(f"\n❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)


def main():
    """Run the test"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Run async test
    asyncio.run(test_sample_video())


if __name__ == "__main__":
    main()
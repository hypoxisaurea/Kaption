"""DeepDive Batch API Test Script (standalone)

Usage:
  uv run test_api_deepdive.py --analysis-file test_result.json
"""

import argparse
import asyncio
import json
import os

import httpx
from dotenv import load_dotenv


async def run(analysis_file: str, api_url: str = "http://localhost:8000"):
    load_dotenv()

    if not os.path.exists(analysis_file):
        print(f"❌ analysis file not found: {analysis_file}")
        print("   먼저 /api/analyze 결과를 파일로 저장해 주세요 (test_result.json)")
        return

    with open(analysis_file, "r", encoding="utf-8") as f:
        analysis = json.load(f)

    checkpoints = analysis.get("checkpoints", [])
    if not checkpoints:
        print("⚠️ No checkpoints in analysis file. Abort DeepDive test.")
        return

    user_profile = analysis.get("user_profile") or {
        "familiarity": 3,
        "language_level": "Intermediate",
        "interests": ["k-pop", "language"],
    }

    deepdive_req = {
        "user_profile": user_profile,
        "checkpoints": checkpoints[:1],
    }

    timeout = httpx.Timeout(120.0, connect=10.0, read=120.0, write=120.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            print("\n📤 Sending deepdive batch request (1 checkpoint)...")
            resp = await client.post(
                f"{api_url}/api/deepdive/batch",
                json=deepdive_req,
            )
            if resp.status_code == 200:
                dd = resp.json()
                items = dd.get("items", [])
                print(f"✅ DeepDive batch successful! items: {len(items)}")
                with open("test_deepdive_result.json", "w", encoding="utf-8") as f:
                    json.dump(dd, f, ensure_ascii=False, indent=2)
                print("💾 DeepDive saved to: test_deepdive_result.json")
            else:
                print(f"❌ DeepDive batch failed: {resp.status_code}")
                print(f"   Error: {resp.text}")
        except Exception as e:
            print(f"❌ DeepDive request failed: {e!r}")


def main():
    parser = argparse.ArgumentParser(description="DeepDive Batch API Test")
    parser.add_argument("--analysis-file", default="test_result.json")
    args = parser.parse_args()

    asyncio.run(run(args.analysis_file))


if __name__ == "__main__":
    main()



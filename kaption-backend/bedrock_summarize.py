# bedrock_summarize.py

import boto3
import json

class BedrockService:
    def __init__(self, region_name: str = 'us-east-1', model_id: str = 'anthropic.claude-v2'):
        # AWS Bedrock 런타임 클라이언트 초기화
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        self.model_id = model_id

    def generate_summary(self, title: str, description: str) -> str:
        """
        주어진 제목과 설명을 사용하여 Bedrock에 요약 요청을 보냅니다.
        """
        prompt = f"""\n\nHuman: 다음은 영상 정보입니다. 이를 100자 이내로 요약해 주세요.
        
영상 제목: {title}
영상 설명: {description}

요약:\n\nAssistant:"""
        payload = {
            "prompt": prompt,
            "max_tokens_to_sample": 300,
            "temperature": 0.1,
            "top_p": 0.9,
        }
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json"
            )
            response_body = json.loads(response['body'].read())
            summary = response_body.get('completion', '').strip()
            return summary
        except Exception as e:
            print(f"Bedrock API 호출 오류: {e}")
            raise e
# Kaption

Kaption은 K-콘텐츠(YouTube 등) 시청 중 핵심 문화 맥락을 발굴해 학습 흐름(Recap → Think → Quiz)으로 안내하는 크롬 확장 서비스입니다. OpenAI Realtime(여성 보이스) TTS와 이벤트 기반 UI를 결합해, 자연스러운 상호작용과 단계 학습을 제공합니다.

## 주요 기능
- **Recap(요약)**: 현재 장면/맥락의 핵심 요약을 TTS로 짧게 낭독해 몰입을 돕습니다.
- **Think(사고)**: 가이드 질문을 바탕으로 사용자가 한 줄 생각을 보내면, **실시간(WebRTC) 대화**로 친근하게 상호작용하며 학습을 확장합니다.
- **Quiz(문제 풀이)**: 문제 텍스트만 보여주며 낭독하지 않습니다. 사용자가 답을 선택/입력하면 **룰 베이스 채점**으로 정답 시 다음 문항 진행, 오답 시 힌트를 음성 또는 텍스트로 안내합니다.
- **카드 → 모달 전환**: 콘텐츠 카드 클릭 시 부드러운 확장 전환과 로딩 오버레이(“Preparing your study pack…”)를 제공합니다.
- **여성 마스코트 음성**: OpenAI Realtime 보이스(예: `sage`, `aria`)로 친근한 여성 톤을 사용합니다.

## 기술 스택
- **Frontend (Chrome Extension)**
  - React + TypeScript
  - Framer
  - Tailwind CSS 
  - WebRTC(DataChannel + Remote Audio Track) for OpenAI Realtime TTS/대화
- **Backend (FastAPI)**
  - Python 3.10+
  - FastAPI + Uvicorn
  - OpenAI Realtime 세션 토큰 프록시 발급 엔드포인트 `/api/tts/session-token`
  - (선택) 분석/배치 생성 API, Deep Dive 배치 등 도메인 로직

## 아키텍처 개요
- 확장(프론트)은 3단계 플로우로 구성됩니다.
  1) Recap: 요약 텍스트를 **OpenAI Realtime TTS**로 낭독 → Think로 자동 이동
  2) Think: 화면의 프롬프트/가이드 질문을 읽고, 시스템 컨텍스트 전송 후 **실시간 대화** 시작. 사용자는 한 줄 입력(Enter/Send)으로 참여. 대화는 해당 주제에만 집중하도록 프롬프트 가드 적용
  3) Quiz: 문제만 표시(낭독 없음). 사용자가 정답 시 “Next Quiz” 활성화. 마지막 문항이면 “Done”으로 모달 닫기
- 이벤트 기반 상태 관리
  - TTS 이벤트(`tts.start`, `tts.delta`, `tts.end`)를 구독해 화면 전환 타이밍을 자연스럽게 제어
  - (옵션) Function Calling 수신(onToolCall)으로 UI 제어 확장 가능 (표준화된 `display_question`, `set_quiz` 등 툴 스키마 등록 예정)

## 디렉토리 구조(요약)
```
Kaption/
├─ chrome-extension/
│  ├─ src/
│  │  ├─ components/ContentPage/
│  │  │  ├─ ContentModule.tsx     # 카드(요약) 컴포넌트
│  │  │  ├─ DeepDiveModal.tsx     # 모달(Recap/Think/Quiz) 메인 UI
│  │  │  └─ HoverOverlay.tsx
│  │  ├─ pages/ContentPage.tsx    # 카드 리스트 + 모달 진입 관리
│  │  ├─ services/tts.ts          # Realtime TTS/WebRTC 유틸(이벤트 훅 포함)
│  │  └─ services/chromeVideo.ts  # 백엔드 API 호출/스토리지 유틸
│  └─ tailwind.config.js
├─ kaption-backend/
│  └─ app/api/server.py           # FastAPI 진입점(Realtime 세션 토큰 프록시 등)
└─ README.md
```

## 설치 및 실행
### 1) 백엔드(FastAPI)
1. 환경설정
   - `.env`에 OpenAI 키 설정
     - `OPENAI_API_KEY=sk-...`
2. 의존성 설치 & 실행
   ```bash
   cd kaption-backend
   pip install -r requirements.txt
   uvicorn app.api.server:app --host 0.0.0.0 --port 8000 --reload
   ```
3. 엔드포인트
   - `POST /api/tts/session-token` → OpenAI Realtime 세션 발급 프록시
   - (기타) 분석/배치 엔드포인트는 서비스 요구사항에 맞춰 확장

### 2) 프론트엔드(Chrome Extension)
1. 의존성 설치
   ```bash
   cd chrome-extension
   yarn install
   ```
2. 개발/빌드
   - CRA/Vite 기반이라면 개발 서버/빌드 스크립트를 사용하세요.
   - 크롬 확장 빌드 후, **Chrome → 확장 프로그램 → 개발자 모드 → 압축해제된 확장 프로그램 로드**로 `build/` 또는 `dist/` 폴더를 등록

## 환경 변수
- **백엔드**
  - `OPENAI_API_KEY`: OpenAI Realtime 및 기타 API 호출에 사용
- **프론트엔드**
  - 기본적으로 `http://localhost:8000`의 백엔드로 토큰 요청

## 동작 상세
### Recap
- 요약 텍스트를 **OpenAI Realtime TTS(여성 보이스)**로 낭독합니다.
- 낭독 종료 이벤트(`tts.end`)를 감지해 Think로 자동 전환합니다.

### Think (대화 중심)
- 화면의 프롬프트/가이드 질문을 낭독 후, 시스템 메시지로 컨텍스트/스타일 가이드를 전송하고 **대화 시작**
- 입력창(한 줄)으로 사용자가 생각을 보내면, **실시간(WebRTC) 응답**으로 짧게 대화형 피드백을 제공합니다.
- 사용자가 준비되면 “Start Quiz” 클릭으로 퀴즈로 이동합니다.

### Quiz
- 문제만 표시(낭독 없음). 정답 공개/설명 자동 낭독은 없습니다.
- **룰 베이스 채점**
  - 객관식: `correct_index`/`answer_index`/`options[].is_correct`/`answer_text` 중 하나라도 매칭되면 정답
  - 주관식: `accepted_answers`/`answer_text` 목록 내 소문자/trim 매칭
- 정답 시에만 “Next Quiz” 활성화, 마지막 문항은 “Done”으로 모달 종료

## Realtime TTS/대화(프런트 내부 동작)
- `services/tts.ts`
  - `prewarmRealtime()`: 사용자 제스처 시점에 오디오/세션 준비(자동재생 정책 대응)
  - `speakRealtime(text)`, `onTts(event, handler)`: 시작/자막 델타/종료 이벤트 훅 제공
  - `sendRealtimeEvent(message)`: DataChannel로 모델에 이벤트 전송
  - (옵션) `onToolCall(handler)`: Realtime function_call 수신 시 UI 제어에 활용 가능

## 개발 가이드
- 코딩 규칙
  - ESLint + Tailwind 플러그인으로 클래스 순서/규칙 점검
  - 함수/상태 이름은 의미 중심, 가독성 우선
- UI 톤앤매너
  - **검정 배경 + 흰색 로고** 헤더, 카드/모달은 **화이트 카드** 톤
  - 마스코트는 화면 우하단에 크게 배치(기본 `w-[40vw]`)

## 보안/개인정보
- API 키는 서버에만 보관하고, 클라이언트에 노출하지 않도록 합니다.
- 마이크 접근은 사용자 제스처 후에만 초기화하고, 세션 종료 시 트랙을 중지합니다.

## 트러블슈팅
- **TTS가 안 들려요**
  - 첫 사용자 상호작용(클릭) 이후에 `prewarmRealtime`이 호출되는지 확인
  - 브라우저 자동재생 정책(사운드) 허용 여부 점검
  - 백엔드 `/api/tts/session-token` 200 응답 확인
- **중복 발화**
  - `DeepDiveModal`은 최근 요청 텍스트를 1.2초 내 재요청 시 무시하는 가드가 있습니다. 특정 단계/문구에서 반복되면 의존성/구독 해제 확인
- **CORS/경로**
  - 백엔드 CORS에 `chrome-extension://`/`http://localhost` 허용 필요
  - 프론트 import는 `services/tts` 등 alias를 사용

## 로드맵
- Realtime Function Calling 툴 스키마 정식 반영(`display_question`, `set_quiz`, `reveal_explanation` 등)
- Think 대화의 주제 유지/맥락 추적 강화(발화 요약/반복 감지)
- 모바일 브라우저(확장 미지원) 대안 UX 검토

## 라이선스
- 추후 업데이트 예정

---
문의/기여 환영합니다. Issue/PR로 논의해주세요.

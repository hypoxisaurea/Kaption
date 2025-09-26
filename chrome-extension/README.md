# Kaption Chrome Extension

Kaption 크롬 확장은 YouTube 시청 중 학습 흐름(Recap → Think → Quiz)을 제공하는 UI를 렌더링하고, OpenAI Realtime TTS/대화 및 백엔드 API와 통신합니다. 이 문서는 프론트 개발자가 DeepDive 동작을 이해하고 수정할 수 있도록 상세히 정리했습니다.

## 실행/빌드
```bash
cd chrome-extension
# 의존성 설치
yarn install
# 개발
yarn start
# 프로덕션 빌드
yarn build
# 크롬 → 확장 프로그램 → 개발자 모드 → 압축해제된 확장 프로그램 로드 → build/ 등록
```

## 코드 구조
```
src/
├─ components/ContentPage/
│  ├─ ContentModule.tsx      # 카드(각 체크포인트) UI + 클릭 시 모달 진입
│  ├─ DeepDiveModal.tsx      # Recap/Think/Quiz 메인 화면 및 TTS/대화 로직
│  └─ HoverOverlay.tsx
├─ pages/ContentPage.tsx     # 카드 목록 + 모달 상태 관리, 로딩 오버레이
├─ services/
│  ├─ chromeVideo.ts         # 백엔드 API(analyze, deepdive/batch) 래퍼
│  └─ tts.ts                 # OpenAI Realtime(WebRTC) TTS/대화 유틸
└─ assets/                   # 이미지(마스코트/로고)
```

## DeepDive: 단계별 플로우
DeepDiveModal는 3단계 단계 머신으로 구성됩니다.
- **recap**: 요약 낭독 → 자동으로 think 진입
- **think**: 화면 텍스트 낭독 후 실시간 대화 시작(입력창), 사용자가 Start Quiz를 누를 때까지 대화 유지
- **quiz**: 문제만 표시(낭독 없음), 룰 베이스 채점으로 정답 시 Next Quiz 활성화, 마지막 문항은 Done으로 종료

### 1) Recap
- 데이터 소스: `deepDiveItem.recap.detailed.summary_main`
- 동작: summary를 OpenAI Realtime TTS로 1회 낭독 → `tts.end` 이벤트를 받으면 자동으로 `think`로 전환
- UI: 화이트 카드, 좌측 상단 타이틀(맥락 제목), 우하단 마스코트(여성 캐릭터, 기본 `w-[40vw]`)

수정 포인트:
- 낭독 내용 변경: `recapSummary` 계산부(DeepDiveModal 내부) 수정
- 전환 타이밍: recap effect에서 `onTts('tts.end')` 구독 구간

### 2) Think (대화 중심)
- 화면 데이터: `tps.think.prompt`, `tps.think.guiding_questions`(최대 1–2개 표시)
- TTS: 화면 텍스트를 한 번 읽고, 이어서 실시간 대화 시작
  - 시스템 메시지로 컨텍스트/톤/금지사항(정답 노출 금지 등) 전송
  - `sendRealtimeEvent({ type:'response.create' ... })`로 모델에게 짧고 대화형 응답 요청
- 사용자 입력: 한 줄 입력창 + Enter/Send → DataChannel로 모델에 전달 → 모델 응답 낭독
- 이동: 자동 전환 없음, “Start Quiz” 버튼으로만 `quiz` 진입

수정 포인트:
- 대화 스타일: Think effect 내 시스템 메시지(컨텍스트/STYLE/POLICY) 편집
- 입력창/전송: Think 섹션의 `input + Send` 핸들러(`sendRealtimeEvent`) 수정
- 더 엄격한 주제 유지: 시스템 메시지에 정책 추가(퀴즈 정답 언급 금지 등)

### 3) Quiz (룰 베이스 채점)
- 낭독 없음: 퀴즈 문제만 화면에 출력
- 객관식: 아래 우선순위로 정답 판정
  1) `quiz.correct_index`
  2) `quiz.answer_index`
  3) `quiz.options[].is_correct === true`
  4) `quiz.answer_text`와 옵션 텍스트 소문자/trim 매칭
- 주관식: `accepted_answers[]` 또는 `answer_text`와 소문자/trim 매칭
- 정답 시: “Next Quiz” 활성화(마지막 문항은 숨김)
- 오답 시: `hints[0]`(있으면) 음성 안내, Next 비활성 유지
- 마지막 문항: “Done” 버튼으로 모달 종료(카드 목록으로 복귀)

수정 포인트:
- 판정 규칙: 객관식/주관식 onClick/Submit 핸들러 내부 로직 수정
- 힌트 정책: 오답 시 읽어줄 텍스트 변경
- 버튼/상태: `answeredCorrectly` state와 Next 버튼 활성화 조건

## TTS/Realtime 유틸(services/tts.ts)
- `prewarmRealtime()`: 사용자 클릭 시점에 세션/오디오 준비(자동재생 정책 우회)
- `speakRealtime(text)`: OpenAI Realtime로 낭독
- `speakNative(text)`: 브라우저 TTS 폴백(현재 Recap/Quiz도 Realtime 사용 중)
- 이벤트 훅
  - `onTts('tts.start'|'tts.delta'|'tts.end', handler)`: 시작/자막 델타/종료 이벤트 구독
  - `sendRealtimeEvent(message)`: DataChannel로 모델 이벤트 전송
- (옵션) **Function Calling 확장**
  - `onToolCall(handler)`: 모델의 function_call 수신 시 UI에 반영(예: `display_question`, `set_quiz`)
  - `setRealtimeTools({ tools, tool_choice, turn_detection })`: 세션 생성 시 툴 스키마 전달
  - `sendToolOutput(callId, output)`: 사용자의 액션 결과를 모델에 회신

## 백엔드 연동(chromeVideo.ts)
- `analyzeCurrentVideo(url, profile)`: 분석 결과(체크포인트들) 수신
- `requestDeepDiveBatch(profile, [checkpoint])`: Recap/TPS/Quiz 패키지 일괄 수신 → `DeepDiveModal`에 전달
- 스토리지 유틸: `saveDeepDiveResultToStorage`, `getUserProfileFromStorage`

## 스타일/UX 가이드
- 카드/모달: **화이트 카드, 검정 배경** 톤, 좌상단 흰색 로고
- 마스코트: 우하단 고정(기본 `w-[40vw]`), 과도한 애니메이션 지양
- Tailwind: 클래스 순서 규칙 준수(플러그인 경고 해결), theme token(`bg-secondary`) 사용 권장

## 트러블슈팅
- **낭독이 중복 재생**: `DeepDiveModal`의 `speak()`는 1.2초 내 동일 텍스트 재요청을 무시합니다. effect 의존성과 구독 해제(onTts off) 확인
- **음성이 안 들림**: 첫 클릭 이후 `prewarmRealtime()` 호출 여부 확인, 브라우저 자동재생 정책/권한 확인
- **토큰/키 오류**: 백엔드 `.env`에 `OPENAI_API_KEY` 올바르게 설정

## 수정 지점 빠른 링크
- 단계 전환/낭독 정책: `DeepDiveModal.tsx`의 useEffect 블록들
- 룰 베이스 채점: `DeepDiveModal.tsx`의 객관식/주관식 onClick/Submit
- 대화 톤/가드: `DeepDiveModal.tsx` Think effect(system 메시지 구성)
- Realtime 이벤트: `services/tts.ts` (onTts/onToolCall/sendRealtimeEvent)

---
필요 시 스크린샷/다이어그램 섹션을 추가해 드릴 수 있습니다. 수정/확장할 부분이 있으면 파일 경로와 함께 요청해 주세요.

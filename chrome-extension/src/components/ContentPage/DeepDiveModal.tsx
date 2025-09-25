/* eslint-disable tailwindcss/classnames-order, tailwindcss/no-unnecessary-arbitrary-value */
import React, { useEffect } from 'react';
import { speakText } from 'services/tts';
import LogoWhite from 'assets/images/logo/logo_white.png';
import floatingTaki from 'assets/images/character/floating_taki.png';
import studyTaki from 'assets/images/character/study_taki.png';
import taki from 'assets/images/character/taki.png';
 

interface Explanation {
  summary: string;
  main: string;
  tip: string;
}

interface Checkpoint {
  timestamp_seconds: number;
  timestamp_formatted: string;
  trigger_keyword: string;
  segment_stt: string;
  scene_description: string;
  context_title: string;
  explanation: Explanation;
  related_interests?: string[];
}

interface DeepDiveModalProps {
  checkpoint: Checkpoint;
  deepDiveItem?: any;
  onClose: () => void;
}

function DeepDiveModal({ checkpoint, deepDiveItem, onClose }: DeepDiveModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // 단계 상태: recap -> think -> quiz -> share -> done
  const [stage, setStage] = React.useState<'recap'|'think'|'quiz'|'share'|'done'>('recap');
  const recap = deepDiveItem?.recap;
  const tps = deepDiveItem?.tps;
  const quizzes = deepDiveItem?.quizzes as any[] | undefined;

  // Recap: Single card summary
  const recapSummary: string = React.useMemo(() => String(recap?.detailed?.summary_main || ''), [recap]);

  const [thinkNotes, setThinkNotes] = React.useState('');
  // Think timer (auto-advance)
  const defaultThinkSeconds = Math.max(10, Math.min(120, tps?.think?.timebox_seconds ?? 30));
  const [thinkTimeLeft, setThinkTimeLeft] = React.useState<number>(defaultThinkSeconds);
  const [thinkRunning, setThinkRunning] = React.useState<boolean>(false);
  // Quiz
  const [currentQuizIndex, setCurrentQuizIndex] = React.useState(0);
  const currentQuiz = quizzes && quizzes[currentQuizIndex];
  const defaultQuizSeconds = 20;
  const [quizTimeLeft, setQuizTimeLeft] = React.useState<number>(defaultQuizSeconds);
  const [quizRunning, setQuizRunning] = React.useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = React.useState<string>('');
  const [revealedHints, setRevealedHints] = React.useState<number>(0);
  const [ttsEnabled] = React.useState<boolean>(true);
  const [mascotShouldAnimate, setMascotShouldAnimate] = React.useState<boolean>(true);
  const [autoAdvance] = React.useState<boolean>(false);
  const [recapTtsSpoken, setRecapTtsSpoken] = React.useState<boolean>(false);

  const speak = (text?: string) => {
    if (!ttsEnabled || !text) return;
    // 리얼타임 우선, 실패 시 네이티브 폴백
    speakText(text, 'realtime');
  };

  // TTS 비활성 시 즉시 중단 (현재 토글 UI는 제거됨)
  useEffect(() => {
    if (!ttsEnabled) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, [ttsEnabled]);

  const mascotSrc = React.useMemo(() => {
    if (stage === 'recap') return floatingTaki;
    if (stage === 'think') return studyTaki;
    if (stage === 'quiz') return taki;
    return null;
  }, [stage]);

  // 마스코트 애니메이션은 최초 1회만
  useEffect(() => {
    const id = setTimeout(() => setMascotShouldAnimate(false), 1200);
    return () => clearTimeout(id);
  }, []);

  // No auto slide; recap is a single summary card

  // Think countdown & auto-advance (auto 모드에서만)
  useEffect(() => {
    if (stage !== 'think') return;
    setThinkTimeLeft(defaultThinkSeconds);
    setThinkRunning(autoAdvance);
    let raf = 0;
    const start = performance.now();
    const tick = (ts: number) => {
      if (!thinkRunning) return;
      const elapsed = Math.floor((ts - start) / 1000);
      const left = Math.max(0, defaultThinkSeconds - elapsed);
      setThinkTimeLeft(left);
      if (left > 0) raf = requestAnimationFrame(tick);
      else if (autoAdvance) setStage('quiz');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, defaultThinkSeconds, thinkRunning, autoAdvance]);

  // Reset quiz timer on quiz index change (auto 모드에서만 동작)
  useEffect(() => {
    if (stage !== 'quiz' || !currentQuiz) return;
    setQuizTimeLeft(defaultQuizSeconds);
    setQuizRunning(autoAdvance);
    setSelectedIdx(null);
    setOpenAnswer('');
    // no-op
    setRevealedHints(0);
    let raf = 0;
    const start = performance.now();
    const tick = (ts: number) => {
      if (!quizRunning) return;
      const elapsed = Math.floor((ts - start) / 1000);
      const left = Math.max(0, defaultQuizSeconds - elapsed);
      setQuizTimeLeft(left);
      if (left > 0) raf = requestAnimationFrame(tick);
      else {
        if (autoAdvance) {
          // Auto-advance after showing explanation briefly
          setTimeout(() => {
            const nextIdx = (currentQuizIndex + 1);
            if (quizzes && nextIdx < quizzes.length) setCurrentQuizIndex(nextIdx);
            else setStage('share');
          }, 2000);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuizIndex, autoAdvance]);

  // Recap TTS once: read the same summary text
  useEffect(() => {
    if (stage !== 'recap') return;
    if (recapTtsSpoken) return;
    const text = recapSummary.trim();
    if (text) {
      speak(text);
      setRecapTtsSpoken(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, recapSummary, recapTtsSpoken]);

  // No separate intro line to avoid mismatch with the card content

  // Think stage TTS
  useEffect(() => {
    if (stage !== 'think') return;
    speak(tps?.think?.tts_line || tps?.think?.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Quiz stage TTS
  useEffect(() => {
    if (stage !== 'quiz') return;
    if (currentQuiz?.question) speak(currentQuiz.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuizIndex]);

  // Share stage TTS
  useEffect(() => {
    if (stage !== 'share') return;
    if (tps?.share?.prompt) speak(tps.share.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-[#1b1b1b]/70 modal-backdrop modal-backdrop--open`} onClick={onClose} />

      {/* Fullscreen Panel */}
      <div className={`absolute inset-0 bg-[#1b1b1b] font-spoqa overflow-y-auto modal-panel modal-panel--open`}>
        {/* Header (sticky) */}
        <div className="sticky top-0 z-[1] flex items-center justify-between px-4 py-3 bg-[#1b1b1b]/90">
          <img src={LogoWhite} alt="Logo" className="block h-auto w-[6vw] shrink-0" />
          <button
            onClick={onClose}
            className="text-white text-[0.95rem] px-3 py-1 rounded hover:bg-white/10 transition-colors"
          >
            Close ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-[6vw] py-[5vw]">
          <div className="bg-white rounded-[3.5vw] px-[6vw] py-[7vw] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6vh]">
            <div className="text-[1rem] font-bold text-[#1b1b1b]">
              {checkpoint.timestamp_formatted}
            </div>
            <div className="max-w-[30vw] border-2 bg-secondary/45 px-[3vw] py-[0.6vh] rounded-full text-[0.8rem] font-medium">
              {checkpoint.trigger_keyword}
            </div>
          </div>

          {/* Stage: Recap - Single summary card */}
          {stage === 'recap' && (
            <div>
              <div className="mb-[3vh] flex items-center justify-between">
                <p className="text-[1.2rem] text-[#1b1b1b] font-bold">{checkpoint.context_title}</p>
              </div>
              <div className="min-h-[24vh]">
                <div className="transition-opacity duration-300 ease-out">
                  <div className="text-[#1b1b1b] text-[0.95rem] font-light leading-relaxed whitespace-pre-line">
                    {recapSummary}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={() => setStage('think')}>Continue</button>
              </div>
            </div>
          )}

          {/* Stage: Think */}
          {stage === 'think' && (
            <div>
              <h3 className="text-[1rem] font-medium text-[#1b1b1b] mb-2">Think</h3>
              <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed mb-3">{tps?.think?.prompt}</p>
              {tps?.think?.guiding_questions?.length ? (
                <ul className="list-disc pl-6 text-[#1b1b1b] text-[0.9rem] space-y-1 mb-3">
                  {tps.think.guiding_questions.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                </ul>
              ) : null}
              {tps?.think?.example_keywords?.length ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tps.think.example_keywords.map((k: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{k}</span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-sm text-gray-700">Time Left: {thinkTimeLeft}s</div>
                <button className="px-3 py-1 rounded-[3vw] border border-gray-300 text-sm hover:bg-black/5" onClick={() => setThinkRunning(r => !r)}>
                  {thinkRunning ? 'Pause' : 'Resume'}
                </button>
              </div>
              <textarea value={thinkNotes} onChange={(e) => setThinkNotes(e.target.value)} placeholder="Write 1–2 sentences..." className="w-full border border-gray-200 rounded-[2.5vw] p-2 text-[0.9rem] mb-3" />
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={() => setStage('quiz')}>Start Quiz</button>
              </div>
            </div>
          )}

          {/* Stage: Quiz */}
          {stage === 'quiz' && currentQuiz && (
            <div>
              <h3 className="text-[1rem] font-medium text-[#1b1b1b] mb-2">Quiz {currentQuizIndex + 1}</h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#1b1b1b] text-[0.95rem] mr-3">{currentQuiz.question}</p>
                <span className="text-xs text-gray-600">Time Left: {quizTimeLeft}s</span>
              </div>
              {currentQuiz.kind === 'multiple_choice' && Array.isArray(currentQuiz.options) && (
                <div className="flex flex-col gap-2 mb-3">
                  {currentQuiz.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      className={`text-left px-3 py-2 rounded-[3vw] border ${selectedIdx === i ? 'border-black bg-gray-100' : 'border-gray-200 hover:bg-gray-100'}`}
                      onClick={() => { setSelectedIdx(i); if (currentQuiz.explanation) speak(currentQuiz.explanation); }}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
              {currentQuiz.kind === 'open_ended' && (
                <div className="mb-3">
                  <input value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} className="w-full border border-gray-200 rounded-[3vw] p-2 text-[0.9rem]" placeholder="Write a one-sentence answer" />
                  <div className="mt-2">
                    <button className="px-3 py-1 rounded-[3vw] bg-black text-white text-sm" onClick={() => { if (currentQuiz.explanation) speak(currentQuiz.explanation); }}>Submit</button>
                  </div>
                </div>
              )}
              {Array.isArray(currentQuiz.hints) && currentQuiz.hints.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {currentQuiz.hints.slice(0, 2).map((h: string, i: number) => (
                    <button key={i} className="px-3 py-1 rounded-[3vw] border border-gray-300 text-sm hover:bg-black/5" onClick={() => setRevealedHints(prev => Math.max(prev, i + 1))}>
                      Hint {i + 1}
                    </button>
                  ))}
                </div>
              )}
              {revealedHints > 0 && (
                <div className="text-[0.9rem] text-[#1b1b1b] bg-[#f9fafb] rounded p-3 mb-3 space-y-1">
                  {currentQuiz.hints?.slice(0, revealedHints).map((h: string, i: number) => (<div key={i}>• {h}</div>))}
                </div>
              )}
              {currentQuiz.explanation && (
                <div className="text-[0.9rem] text-[#1b1b1b] bg-[#f8f8f8] rounded p-3 mb-3">{currentQuiz.explanation}</div>
              )}
              <div className="flex gap-2">
                {currentQuizIndex + 1 < (quizzes?.length || 0) ? (
                  <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={() => setCurrentQuizIndex((idx) => idx + 1)}>Next Quiz</button>
                ) : (
                  <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={() => setStage('share')}>Summarize</button>
                )}
              </div>
            </div>
          )}

          {/* Stage: Share */}
          {stage === 'share' && (
            <div>
              <h3 className="text-[1rem] font-medium text-[#1b1b1b] mb-2">Share</h3>
              <p className="text-[#1b1b1b] text-[0.9rem] font-light leading-relaxed mb-3">{tps?.share?.prompt}</p>
              <div className="grid grid-cols-1 gap-2 mb-3">
                {(tps?.share?.report_template || ["claim","evidence","example","korean_term"]).map((key: string) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="w-28 text-xs uppercase text-gray-500">{key}</label>
                    <input className="flex-1 border border-gray-200 rounded-[3vw] p-2 text-[0.9rem]" />
                  </div>
                ))}
              </div>
              {tps?.share?.self_check?.length ? (
                <ul className="list-disc pl-6 text-[#1b1b1b] text-[0.9rem] space-y-1 mb-3">
                  {tps.share.self_check.map((c: string, i: number) => (<li key={i}>{c}</li>))}
                </ul>
              ) : null}
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-[3vw] border border-gray-300 hover:bg-black/5" onClick={() => {
                  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
                  const data: Record<string,string> = {};
                  (tps?.share?.report_template || ["claim","evidence","example","korean_term"]).forEach((k: string, i: number) => { data[k] = inputs[i]?.value || ''; });
                  navigator.clipboard?.writeText(JSON.stringify(data));
                }}>Copy</button>
                <button className="px-4 py-2 rounded-[3vw] bg-[#2EC4B6] text-white" onClick={() => setStage('done')}>Done</button>
              </div>
            </div>
          )}

          {stage === 'done' && (
            <div className="text-[#1b1b1b]">Nice work! You can close via the back button.</div>
          )}
          </div>
        </div>
        {/* Mascot Overlay */}
        {mascotSrc && (
          <div className="pointer-events-none absolute right-4 bottom-6 z-[2] transition-all duration-500 ease-out">
            <img
              src={mascotSrc}
              alt="Tutor mascot"
              className={mascotShouldAnimate ? 'w-[22vw] animate-bounce' : 'w-[22vw]'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DeepDiveModal;



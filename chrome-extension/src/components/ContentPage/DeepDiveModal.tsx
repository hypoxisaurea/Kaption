/* eslint-disable tailwindcss/classnames-order, tailwindcss/no-unnecessary-arbitrary-value */
import React, { useEffect } from 'react';
import { speakNative, speakRealtime } from 'services/tts';
import { onTts } from 'services/tts';
import { sendRealtimeEvent } from 'services/tts';
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
  const [stage, setStage] = React.useState<'recap'|'think'|'quiz'|'done'>('recap');
  const recap = deepDiveItem?.recap;
  const tps = deepDiveItem?.tps;
  const quizzes = deepDiveItem?.quizzes as any[] | undefined;

  // Recap: Single card summary
  const recapSummary: string = React.useMemo(() => String(recap?.detailed?.summary_main || ''), [recap]);

  const [thinkNotes, setThinkNotes] = React.useState('');
  const [answeredCorrectly, setAnsweredCorrectly] = React.useState<boolean>(false);
  const [thinkChat, setThinkChat] = React.useState('');
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
  const lastSpeakRef = React.useRef<{ text: string; at: number } | null>(null);

  const speak = (text?: string) => {
    if (!ttsEnabled || !text) return;
    const now = performance.now();
    const last = lastSpeakRef.current;
    if (last && last.text === text && now - last.at < 1200) return;
    lastSpeakRef.current = { text, at: now };
    speakRealtime(text);
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
    return () => {};
  }, [stage]);

  // Reset quiz timer on quiz index change (auto 모드에서만 동작)
  useEffect(() => {
    if (stage !== 'quiz' || !currentQuiz) return;
    setQuizTimeLeft(defaultQuizSeconds);
    setQuizRunning(false);
    setSelectedIdx(null);
    setOpenAnswer('');
    setRevealedHints(0);
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuizIndex]);

  // Recap TTS once: read the same summary text
  useEffect(() => {
    if (stage !== 'recap') return;
    let moved = false;
    const off = onTts('tts.end', () => {
      if (!moved) {
        moved = true;
        setStage('think');
      }
    });
    const text = recapSummary.trim();
    if (text) speak(text);
    return () => { if (off) off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, recapSummary]);

  // No separate intro line to avoid mismatch with the card content

  // Think stage TTS: read what's rendered + conversational nudge
  useEffect(() => {
    if (stage !== 'think') return;
    const lines: string[] = [];
    if (tps?.think?.prompt) lines.push(String(tps.think.prompt));
    if (Array.isArray(tps?.think?.guiding_questions) && tps!.think!.guiding_questions.length > 0) {
      const qs = tps!.think!.guiding_questions.slice(0, 2).map(String);
      lines.push(...qs);
    }
    lines.push("When you're ready, press Start Quiz.");
    lines.push("Before that, share one short thought about this topic—let's chat.");
    const text = lines.join('\n');
    speak(text);
    // After reading, kick off an on-topic realtime conversation
    const off = onTts('tts.end', () => {
      const ctx: string[] = [];
      ctx.push(`[CONTEXT]\nTitle: ${checkpoint.context_title}`);
      if (tps?.think?.prompt) ctx.push(`Prompt: ${tps.think.prompt}`);
      if (Array.isArray(tps?.think?.guiding_questions)) ctx.push(`Guiding: ${tps.think.guiding_questions.slice(0, 3).join(' | ')}`);
      ctx.push(`[STYLE] English only. 1-2 sentences. Friendly, conversational. Ask exactly one short follow-up question.`);
      ctx.push(`[POLICY] Stay strictly on this topic. Do NOT reveal any quiz answers or solutions.`);
      const systemMsg = ctx.join('\n');
      sendRealtimeEvent({
        type: 'conversation.item.create',
        item: { type: 'message', role: 'system', content: [{ type: 'input_text', text: systemMsg }] }
      });
      sendRealtimeEvent({ type: 'response.create', response: { instructions: 'Start a brief on-topic convo. Ask one short follow-up. Keep it friendly.' } });
      off();
    });
    return () => { off && off(); };
  }, [stage]);

  // Quiz stage TTS
  useEffect(() => {
    if (stage !== 'quiz') return;
    // No TTS in quiz; only reset correctness state
    setAnsweredCorrectly(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuizIndex]);
  // No auto-advance after explanation; user controls next
  useEffect(() => {
    if (stage !== 'quiz') return;
    let off: (() => void) | null = null;
    off = onTts('tts.end', () => {
      if (currentQuizIndex + 1 < (quizzes?.length || 0)) setCurrentQuizIndex(nextIdx => nextIdx + 1);
      else setStage('done');
    });
    return () => { if (off) off(); };
  }, [stage, currentQuizIndex, quizzes]);

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
              <div className="mt-4" />
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
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={thinkChat}
                  onChange={(e) => setThinkChat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const msg = thinkChat.trim();
                      if (!msg) return;
                      sendRealtimeEvent({
                        type: 'conversation.item.create',
                        item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: msg }] }
                      });
                      sendRealtimeEvent({ type: 'response.create', response: { instructions: 'Respond briefly and conversationally to the user\'s thought.' } });
                      setThinkChat('');
                    }
                  }}
                  placeholder="Share a short thought..."
                  className="flex-1 rounded-[3vw] border border-gray-200 p-2 text-[0.9rem]"
                />
                <button
                  className="rounded-[3vw] bg-black px-3 py-1 text-sm text-white"
                  onClick={() => {
                    const msg = thinkChat.trim();
                    if (!msg) return;
                    sendRealtimeEvent({
                      type: 'conversation.item.create',
                      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: msg }] }
                    });
                    sendRealtimeEvent({ type: 'response.create', response: { instructions: 'Respond briefly and conversationally to the user\'s thought.' } });
                    setThinkChat('');
                  }}
                >
                  Send
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={() => setStage('quiz')}>Start Quiz</button>
              </div>
            </div>
          )}

          {/* Stage: Quiz */}
          {stage === 'quiz' && currentQuiz && (
            <div>
              <h3 className="text-[1rem] font-medium text-[#1b1b1b] mb-2">Quiz {currentQuizIndex + 1}</h3>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[#1b1b1b] text-[0.95rem] mr-3">{currentQuiz.question}</p>
              </div>
              {currentQuiz.kind === 'multiple_choice' && Array.isArray(currentQuiz.options) && (
                <div className="mb-3 flex flex-col gap-2">
                  {currentQuiz.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      className={`text-left px-3 py-2 rounded-[3vw] border ${selectedIdx === i ? 'border-black bg-gray-100' : 'border-gray-200 hover:bg-gray-100'}`}
                      onClick={() => {
                        setSelectedIdx(i);
                        // rule-based correctness
                        const correctIdx = (typeof currentQuiz.correct_index === 'number') ? currentQuiz.correct_index
                          : (typeof currentQuiz.answer_index === 'number') ? currentQuiz.answer_index
                          : (Array.isArray(currentQuiz.options) && currentQuiz.options.findIndex((o: any) => o?.is_correct)) >= 0
                            ? currentQuiz.options.findIndex((o: any) => o?.is_correct)
                            : (typeof currentQuiz.answer_text === 'string')
                              ? currentQuiz.options.findIndex((o: any) => String(o?.text || '').trim().toLowerCase() === String(currentQuiz.answer_text).trim().toLowerCase())
                              : -1;
                        const isCorrect = correctIdx >= 0 ? i === correctIdx : false;
                        if (isCorrect) {
                          setAnsweredCorrectly(true);
                          speak("That's correct! Let's move on when you're ready.");
                        } else {
                          const hint = Array.isArray(currentQuiz.hints) && currentQuiz.hints.length > 0
                            ? currentQuiz.hints[0]
                            : 'Think again. Focus on tense and the key clue.';
                          speak(hint);
                        }
                      }}
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
                    <button className="px-3 py-1 rounded-[3vw] bg-black text-white text-sm" onClick={() => {
                      const input = String(openAnswer || '').trim().toLowerCase();
                      const answers: string[] = Array.isArray(currentQuiz.accepted_answers) ? currentQuiz.accepted_answers.map((a: any) => String(a).trim().toLowerCase())
                        : currentQuiz.answer_text ? [String(currentQuiz.answer_text).trim().toLowerCase()] : [];
                      const ok = answers.length > 0 ? answers.includes(input) : false;
                      if (ok) {
                        setAnsweredCorrectly(true);
                        speak("That's correct! Let's move on when you're ready.");
                      } else {
                        const hint = Array.isArray(currentQuiz.hints) && currentQuiz.hints.length > 0
                          ? currentQuiz.hints[0]
                          : 'Consider the key term or tense for this question.';
                        speak(hint);
                      }
                    }}>Submit</button>
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
              {currentQuizIndex + 1 < (quizzes?.length || 0) && (
                <div className="flex gap-2">
                  <button disabled={!answeredCorrectly} className={`px-4 py-2 rounded-[3vw] ${answeredCorrectly ? 'bg-black text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => setCurrentQuizIndex((idx) => idx + 1)}>Next Quiz</button>
                </div>
              )}
              {currentQuizIndex + 1 >= (quizzes?.length || 0) && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-[3vw] bg-black text-white" onClick={onClose}>Done</button>
                </div>
              )}
            </div>
          )}

          {stage === 'done' && (
            <div className="text-[#1b1b1b]">Great job! Learning complete. Use Close (top-right) to return.</div>
          )}
          </div>
        </div>
        {/* Mascot Overlay */}
        {mascotSrc && (
          <div className="pointer-events-none absolute right-4 bottom-6 z-[2] transition-all duration-500 ease-out">
            <img
              src={mascotSrc}
              alt="Tutor mascot"
              className={mascotShouldAnimate ? 'w-[40vw] animate-bounce' : 'w-[40vw]'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DeepDiveModal;



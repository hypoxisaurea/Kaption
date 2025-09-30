/* eslint-disable tailwindcss/classnames-order, tailwindcss/no-unnecessary-arbitrary-value */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import floatingTaki from 'assets/images/character/floating_taki.png';
import studyTaki from 'assets/images/character/study_taki.png';
import taki from 'assets/images/character/taki.png';
import useDeepDiveStages from 'hooks/useDeepDiveStages';
import closeButton from 'assets/images/icon/button_close.png';
import { Checkpoint } from 'types';

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
    // lock scroll on mount
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [onClose]);

  const {
    stage, setStage,
    recapSummary,
    tps,
    quizzes,
    currentQuizIndex, setCurrentQuizIndex,
    currentQuiz,
    selectedIdx, setSelectedIdx,
    openAnswer, setOpenAnswer,
    revealedHints, setRevealedHints,
    answeredCorrectly,
    attemptResult,
    thinkChat,
    mascotShouldAnimate,
    actions,
  } = useDeepDiveStages({ checkpoint, deepDiveItem });

  const mascotSrc = React.useMemo(() => {
    if (stage === 'recap') return floatingTaki;
    if (stage === 'think') return studyTaki;
    if (stage === 'quiz') return taki;
    return null as unknown as string | null;
  }, [stage]);

  // Center O/X feedback overlay
  const [feedbackVisible, setFeedbackVisible] = React.useState(false);
  React.useEffect(() => {
    if (stage !== 'quiz') return;
    if (attemptResult === 'none') return;
    setFeedbackVisible(true);
    const id = window.setTimeout(() => setFeedbackVisible(false), 900);
    return () => window.clearTimeout(id);
  }, [attemptResult, stage]);

  const formattedKeyword = checkpoint.trigger_keyword.includes('/')
  ? checkpoint.trigger_keyword.replace('/', '\n')
  : checkpoint.trigger_keyword;

  return createPortal((
    <div className="fixed w-full h-screen inset-0 z-50">

      {/* Fullscreen Panel */}
      <div className={`absolute w-full h-screen inset-0 bg-white font-spoqa flex flex-col overflow-hidden modal-panel modal-panel--open`}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-[4vw] mt-[5vh] mb-[3vh]">
          <img src={closeButton}
            onClick={onClose}
            className="w-[5vw] h-auto"
          />
        </div>

        {/* Content (fills the remaining viewport height) */}
        <div className="flex-1 px-[4vw] py-[2vh]">
          <div className="w-full min-h-full bg-white rounded-none px-[4vw] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6vh]">
            <div className="text-[1rem] font-bold text-[#1b1b1b]">
              {checkpoint.timestamp_formatted}
            </div>
            <div className="max-w-[30vw] items-center rounded-[4vw] bg-secondary/45 px-[4vw] py-[0.75vh] text-[0.75rem] text-end" style={{ whiteSpace: 'pre-line' }}>
              {formattedKeyword}
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
                  onChange={(e) => actions.setThinkChat(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') actions.sendThinkChat(); }}
                  placeholder="Share a short thought..."
                  className="flex-1 rounded-[3vw] border border-gray-200 p-2 text-[0.9rem]"
                />
                <button
                  className="rounded-[3vw] bg-black px-3 py-1 text-sm text-white"
                  onClick={() => actions.sendThinkChat()}
                >
                  Send
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-[2vh] rounded-[3vw] bg-black text-white" onClick={() => actions.goQuiz()}>Start Quiz</button>
              </div>
            </div>
          )}

          {/* Stage: Quiz */}
          {stage === 'quiz' && currentQuiz && (
            <div>
              <h3 className="text-[1rem] font-medium text-[#1b1b1b] mb-2">Quiz {currentQuizIndex + 1}</h3>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[#1b1b1b] text-[0.95rem] mr-3">{currentQuiz.question}</p>
                {attemptResult !== 'none' && (
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.95rem] ${attemptResult === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {attemptResult === 'correct' ? 'O' : 'X'}
                  </div>
                )}
              </div>
              {currentQuiz.kind === 'multiple_choice' && Array.isArray(currentQuiz.options) && (
                <div className="mb-3 flex flex-col gap-2">
                  {currentQuiz.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      className={`text-left px-3 py-2 rounded-[3vw] border ${selectedIdx === i ? 'border-black bg-gray-100' : 'border-gray-200 hover:bg-gray-100'}`}
                      onClick={() => actions.chooseOption(currentQuiz, i)}
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
                    <button className="px-3 py-1 rounded-[3vw] bg-black text-white text-sm" onClick={() => actions.submitOpenEnded(currentQuiz, openAnswer)}>Submit</button>
                  </div>
                </div>
              )}
              {Array.isArray(currentQuiz.hints) && currentQuiz.hints.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {currentQuiz.hints.slice(0, 2).map((h: string, i: number) => (
                    <button key={i} className="px-3 py-1 rounded-[3vw] border border-gray-300 text-sm hover:bg-black/5" onClick={() => actions.revealHint(i)}>
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
                  <button disabled={!answeredCorrectly} className={`px-4 py-2 rounded-[3vw] ${answeredCorrectly ? 'bg-black text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => actions.nextQuizOrDone()}>Next Quiz</button>
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
          <div className="pointer-events-none absolute right-4 bottom-6 z-[30] transition-all duration-500 ease-out">
            <img
              src={mascotSrc}
              alt="Tutor mascot"
              className={mascotShouldAnimate ? 'w-[40vw] animate-bounce' : 'w-[40vw]'}
            />
          </div>
        )}

        {/* O/X Feedback Overlay */}
        {stage === 'quiz' && attemptResult !== 'none' && (
          <div className={`pointer-events-none fixed inset-0 z-[70] flex items-center justify-center transition-all duration-300 ease-out transform ${feedbackVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className={`flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${attemptResult === 'correct' ? 'bg-green-500' : 'bg-red-500'} w-[42vw] h-[42vw] max-w-[240px] max-h-[240px]`}> 
              <div className="text-white font-bold select-none" style={{ fontSize: '18vw', lineHeight: 1 }}>
                {attemptResult === 'correct' ? 'O' : 'X'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ), document.body);
}

export default DeepDiveModal;
import { useEffect, useMemo, useRef, useState } from "react";
import { onTts, sendRealtimeEvent, speakRealtime, prewarmRealtime } from "services/tts";

export type DeepDiveStage = "recap" | "think" | "quiz" | "done";

export interface UseDeepDiveStagesOptions {
  checkpoint: any;
  deepDiveItem?: any;
}

export default function useDeepDiveStages({
  checkpoint,
  deepDiveItem,
}: UseDeepDiveStagesOptions) {
  const [stage, setStage] = useState<DeepDiveStage>("recap");
  const recap = deepDiveItem?.recap;
  const tps = deepDiveItem?.tps;
  const quizzes = deepDiveItem?.quizzes as any[] | undefined;
  const recapSummary: string = useMemo(
    () => String(recap?.detailed?.summary_main || ""),
    [recap]
  );

  const [thinkChat, setThinkChat] = useState("");
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean>(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const currentQuiz = quizzes && quizzes[currentQuizIndex];
  const defaultQuizSeconds = 20; // reserved
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(defaultQuizSeconds);
  const [quizRunning, setQuizRunning] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState<string>("");
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [attemptResult, setAttemptResult] = useState<"none" | "correct" | "wrong">("none");
  const [ttsEnabled] = useState<boolean>(true);
  const [mascotShouldAnimate, setMascotShouldAnimate] = useState<boolean>(true);
  const lastSpeakRef = useRef<{ text: string; at: number } | null>(null);

  const speak = (text?: string) => {
    if (!ttsEnabled || !text) return;
    const now = performance.now();
    const last = lastSpeakRef.current;
    if (last && last.text === text && now - last.at < 1200) return;
    lastSpeakRef.current = { text, at: now };
    (async () => {
      const ok1 = await speakRealtime(text);
      if (!ok1) {
        await prewarmRealtime();
        await new Promise((r) => setTimeout(r, 150));
        await speakRealtime(text);
      }
    })().catch(() => {});
  };

  useEffect(() => {
    const id = setTimeout(() => setMascotShouldAnimate(false), 1200);
    return () => clearTimeout(id);
  }, []);

  // Recap -> Think로 자동 전환 + TTS
  useEffect(() => {
    if (stage !== "recap") return;
    let moved = false;
    const off = onTts("tts.end", () => {
      if (!moved) {
        moved = true;
        setStage("think");
      }
    });
    const text = recapSummary.trim();
    if (text) speak(text);
    return () => {
      if (off) off();
    };
  }, [stage, recapSummary]);

  // Think TTS 및 대화 시작
  useEffect(() => {
    if (stage !== "think") return;
    const lines: string[] = [];
    if (tps?.think?.prompt) lines.push(String(tps.think.prompt));
    if (
      Array.isArray(tps?.think?.guiding_questions) &&
      tps!.think!.guiding_questions.length > 0
    ) {
      const qs = tps!.think!.guiding_questions.slice(0, 2).map(String);
      lines.push(...qs);
    }
    lines.push("When you're ready, press Start Quiz.");
    lines.push(
      "Before that, share one short thought about this topic—let's chat."
    );
    const text = lines.join("\n");
    speak(text);
    const off = onTts("tts.end", () => {
      const ctx: string[] = [];
      ctx.push(`[CONTEXT]\nTitle: ${checkpoint.context_title}`);
      if (tps?.think?.prompt) ctx.push(`Prompt: ${tps.think.prompt}`);
      if (Array.isArray(tps?.think?.guiding_questions))
        ctx.push(
          `Guiding: ${tps.think.guiding_questions.slice(0, 3).join(" | ")}`
        );
      ctx.push(
        `[STYLE] English only. 1-2 sentences. Friendly, conversational. Ask exactly one short follow-up question.`
      );
      ctx.push(
        `[POLICY] Stay strictly on this topic. Do NOT reveal any quiz answers or solutions.`
      );
      const systemMsg = ctx.join("\n");
      sendRealtimeEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: systemMsg }],
        },
      });
      sendRealtimeEvent({
        type: "response.create",
        response: {
          instructions:
            "Start a brief on-topic convo. Ask one short follow-up. Keep it friendly.",
        },
      });
      off();
    });
    return () => {
      off && off();
    };
  }, [stage]);

  // Quiz stage 초기화
  useEffect(() => {
    if (stage !== "quiz" || !currentQuiz) return;
    setQuizTimeLeft(defaultQuizSeconds);
    setQuizRunning(false);
    setSelectedIdx(null);
    setOpenAnswer("");
    setRevealedHints(0);
    setAttemptResult("none");
    return () => {};
  }, [stage, currentQuiz]);

  useEffect(() => {
    if (stage !== "quiz") return;
    setAnsweredCorrectly(false);
  }, [stage, currentQuizIndex]);

  useEffect(() => {
    if (stage !== "quiz") return;
    let off: (() => void) | null = null;
    off = onTts("tts.end", () => {
      // Do not auto-advance; user controls progression via Next/Done
    });
    return () => {
      if (off) off();
    };
  }, [stage]);

  const actions = {
    goQuiz: () => setStage("quiz" as DeepDiveStage),
    setThinkChat,
    sendThinkChat: () => {
      const msg = thinkChat.trim();
      if (!msg) return;
      sendRealtimeEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: msg }],
        },
      });
      sendRealtimeEvent({
        type: "response.create",
        response: {
          instructions:
            "Respond briefly and conversationally to the user's thought.",
        },
      });
      setThinkChat("");
    },
    chooseOption: (
      currentQuiz: any,
      i: number,
      speakHint: (t: string) => void
    ) => {
      // correctness 추론
      const correctIdx =
        // 공식 스키마: correct_option_index
        typeof currentQuiz.correct_option_index === "number"
          ? currentQuiz.correct_option_index
          // 과거/기타 필드들 호환
          : typeof currentQuiz.correct_index === "number"
            ? currentQuiz.correct_index
            : typeof currentQuiz.answer_index === "number"
              ? currentQuiz.answer_index
              : (Array.isArray(currentQuiz.options) &&
                    currentQuiz.options.findIndex((o: any) => o?.is_correct)) >= 0
                ? currentQuiz.options.findIndex((o: any) => o?.is_correct)
                : typeof currentQuiz.correct_answer_text === "string"
                  ? currentQuiz.options.findIndex(
                      (o: any) =>
                        String(o?.text || "").trim().toLowerCase() ===
                        String(currentQuiz.correct_answer_text).trim().toLowerCase()
                    )
                  : typeof currentQuiz.answer_text === "string"
                    ? currentQuiz.options.findIndex(
                        (o: any) =>
                          String(o?.text || "").trim().toLowerCase() ===
                          String(currentQuiz.answer_text).trim().toLowerCase()
                      )
                    : -1;
      const isCorrect = correctIdx >= 0 ? i === correctIdx : false;
      if (isCorrect) {
        setAnsweredCorrectly(true);
        setAttemptResult("correct");
      } else {
        setAttemptResult("wrong");
        const maxHints = Array.isArray(currentQuiz.hints)
          ? Math.min(2, currentQuiz.hints.length)
          : 0;
        setRevealedHints((prev) => {
          const next = Math.max(1, prev + 1);
          return Math.min(next, maxHints);
        });
      }
      setSelectedIdx(i);
    },
    submitOpenEnded: (
      currentQuiz: any,
      input: string,
      speakHint: (t: string) => void
    ) => {
      const normalized = String(input || "")
        .trim()
        .toLowerCase();
      const answers: string[] = Array.isArray(currentQuiz.accepted_answers)
        ? currentQuiz.accepted_answers.map((a: any) => String(a).trim().toLowerCase())
        : currentQuiz.correct_answer_text
          ? [String(currentQuiz.correct_answer_text).trim().toLowerCase()]
          : currentQuiz.answer_text
            ? [String(currentQuiz.answer_text).trim().toLowerCase()]
            : [];
      const ok = answers.length > 0 ? answers.includes(normalized) : false;
      if (ok) {
        setAnsweredCorrectly(true);
        setAttemptResult("correct");
      } else {
        setAttemptResult("wrong");
        const maxHints = Array.isArray(currentQuiz.hints)
          ? Math.min(2, currentQuiz.hints.length)
          : 0;
        setRevealedHints((prev) => {
          const next = Math.max(1, prev + 1);
          return Math.min(next, maxHints);
        });
      }
    },
    revealHint: (i: number) =>
      setRevealedHints((prev) => Math.max(prev, i + 1)),
    nextQuizOrDone: () => {
      if (currentQuizIndex + 1 < (quizzes?.length || 0))
        setCurrentQuizIndex((idx) => idx + 1);
      else setStage("done");
    },
  };

  return {
    // state
    stage,
    setStage,
    recapSummary,
    tps,
    quizzes,
    currentQuizIndex,
    setCurrentQuizIndex,
    currentQuiz,
    selectedIdx,
    setSelectedIdx,
    openAnswer,
    setOpenAnswer,
    revealedHints,
    setRevealedHints,
    answeredCorrectly,
    thinkChat,
    mascotShouldAnimate,
    attemptResult,
    // actions
    actions,
  };
}

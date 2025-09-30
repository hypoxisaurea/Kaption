import { useState, useEffect, useMemo } from "react";
import { onTts } from "services/tts";
import useDeepDiveTts from "./useDeepDiveTts";
import useThinkChat from "./useThinkChat";
import useQuizLogic from "./useQuizLogic";

export type DeepDiveStage = "recap" | "think" | "quiz" | "done";

export interface UseDeepDiveStagesOptions {
  checkpoint: any;
  deepDiveItem?: any;
}

export function useDeepDiveStages({
  checkpoint,
  deepDiveItem,
}: UseDeepDiveStagesOptions) {
  const [stage, setStage] = useState<DeepDiveStage>("recap");
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [mascotShouldAnimate, setMascotShouldAnimate] = useState<boolean>(true);

  const recap = deepDiveItem?.recap;
  const tps = deepDiveItem?.tps;
  const quizzes = deepDiveItem?.quizzes as any[] | undefined;

  const recapSummary: string = useMemo(
    () => String(recap?.detailed?.summary_main || ""),
    [recap]
  );

  const currentQuiz = quizzes && quizzes[currentQuizIndex];

  // TTS hook
  const { speak } = useDeepDiveTts({
    stage,
    text: recapSummary,
    onTtsEnd: () => setStage("think"),
  });

  // Think chat hook
  const { thinkChat, setThinkChat, sendThinkChat, startThinkConversation } =
    useThinkChat({
      checkpoint,
      tps,
    });

  // Quiz logic hook
  const {
    selectedIdx,
    setSelectedIdx,
    openAnswer,
    setOpenAnswer,
    revealedHints,
    setRevealedHints,
    attemptResult,
    answeredCorrectly,
    chooseOption,
    submitOpenEnded,
    revealHint,
    resetQuiz,
  } = useQuizLogic({
    quiz: currentQuiz,
  });

  // Mascot animation
  useEffect(() => {
    const id = setTimeout(() => setMascotShouldAnimate(false), 1200);
    return () => clearTimeout(id);
  }, []);

  // Think stage TTS and conversation
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
      startThinkConversation();
      off();
    });

    return () => {
      off && off();
    };
  }, [stage, tps, speak, startThinkConversation]);

  // Quiz stage initialization
  useEffect(() => {
    if (stage !== "quiz" || !currentQuiz) return;
    resetQuiz();
  }, [stage, currentQuiz, resetQuiz]);

  useEffect(() => {
    if (stage !== "quiz") return;
    // Reset answered correctly state when quiz changes
  }, [stage, currentQuizIndex]);

  const actions = {
    goQuiz: () => setStage("quiz" as DeepDiveStage),
    setThinkChat,
    sendThinkChat,
    chooseOption: (currentQuiz: any, i: number) => chooseOption(currentQuiz, i),
    submitOpenEnded: (currentQuiz: any, input: string) =>
      submitOpenEnded(currentQuiz, input),
    revealHint,
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

export default useDeepDiveStages;

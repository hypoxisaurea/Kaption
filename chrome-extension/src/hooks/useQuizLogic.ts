import { useState, useCallback } from "react";

export interface QuizOption {
  text: string;
  is_correct?: boolean;
}

export interface Quiz {
  question?: string;
  options?: QuizOption[];
  correct_option_index?: number;
  correct_index?: number;
  answer_index?: number;
  correct_answer_text?: string;
  answer_text?: string;
  accepted_answers?: string[];
  hints?: string[];
}

export interface UseQuizLogicOptions {
  quiz: Quiz | undefined;
  onAnswer?: (isCorrect: boolean) => void;
}

export function useQuizLogic({ quiz, onAnswer }: UseQuizLogicOptions) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState<string>("");
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [attemptResult, setAttemptResult] = useState<
    "none" | "correct" | "wrong"
  >("none");
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean>(false);

  const getCorrectIndex = useCallback((currentQuiz: Quiz): number => {
    // 공식 스키마: correct_option_index
    if (typeof currentQuiz.correct_option_index === "number") {
      return currentQuiz.correct_option_index;
    }

    // 과거/기타 필드들 호환
    if (typeof currentQuiz.correct_index === "number") {
      return currentQuiz.correct_index;
    }

    if (typeof currentQuiz.answer_index === "number") {
      return currentQuiz.answer_index;
    }

    if (Array.isArray(currentQuiz.options)) {
      const correctOptionIndex = currentQuiz.options.findIndex(
        (o) => o?.is_correct
      );
      if (correctOptionIndex >= 0) {
        return correctOptionIndex;
      }
    }

    if (typeof currentQuiz.correct_answer_text === "string") {
      return (
        currentQuiz.options?.findIndex(
          (o) =>
            String(o?.text || "")
              .trim()
              .toLowerCase() ===
            String(currentQuiz.correct_answer_text).trim().toLowerCase()
        ) ?? -1
      );
    }

    if (typeof currentQuiz.answer_text === "string") {
      return (
        currentQuiz.options?.findIndex(
          (o) =>
            String(o?.text || "")
              .trim()
              .toLowerCase() ===
            String(currentQuiz.answer_text).trim().toLowerCase()
        ) ?? -1
      );
    }

    return -1;
  }, []);

  const chooseOption = useCallback(
    (currentQuiz: Quiz, i: number) => {
      const correctIdx = getCorrectIndex(currentQuiz);
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
      onAnswer?.(isCorrect);
    },
    [getCorrectIndex, onAnswer]
  );

  const submitOpenEnded = useCallback(
    (currentQuiz: Quiz, input: string) => {
      const normalized = String(input || "")
        .trim()
        .toLowerCase();
      const answers: string[] = Array.isArray(currentQuiz.accepted_answers)
        ? currentQuiz.accepted_answers.map((a: any) =>
            String(a).trim().toLowerCase()
          )
        : currentQuiz.correct_answer_text
          ? [String(currentQuiz.correct_answer_text).trim().toLowerCase()]
          : currentQuiz.answer_text
            ? [String(currentQuiz.answer_text).trim().toLowerCase()]
            : [];

      const isCorrect =
        answers.length > 0 ? answers.includes(normalized) : false;

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

      onAnswer?.(isCorrect);
    },
    [onAnswer]
  );

  const revealHint = useCallback((i: number) => {
    setRevealedHints((prev) => Math.max(prev, i + 1));
  }, []);

  const resetQuiz = useCallback(() => {
    setSelectedIdx(null);
    setOpenAnswer("");
    setRevealedHints(0);
    setAttemptResult("none");
    setAnsweredCorrectly(false);
  }, []);

  return {
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
  };
}

export default useQuizLogic;

import { useState, useCallback } from "react";
import { sendRealtimeEvent } from "services/tts";

export interface UseThinkChatOptions {
  checkpoint: any;
  tps?: any;
}

export function useThinkChat({ checkpoint, tps }: UseThinkChatOptions) {
  const [thinkChat, setThinkChat] = useState("");

  const sendThinkChat = useCallback(() => {
    const msg = thinkChat.trim();
    if (!msg) return;

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
  }, [thinkChat, checkpoint, tps]);

  const startThinkConversation = useCallback(() => {
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
  }, [checkpoint, tps]);

  return {
    thinkChat,
    setThinkChat,
    sendThinkChat,
    startThinkConversation,
  };
}

export default useThinkChat;

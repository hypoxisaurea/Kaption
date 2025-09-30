import { TtsMode, TtsEventName, TtsEventHandler } from "types";

const API_BASE = "http://localhost:8000";

let pc: RTCPeerConnection | null = null;
let dc: RTCDataChannel | null = null;
let audioEl: HTMLAudioElement | null = null;
let ready = false;
let dcOpenPromise: Promise<void> | null = null;
let audioUnlocked = false;
let sessionVoice = "sage";
let sessionTools: null | {
  tools?: any[];
  tool_choice?: string;
  turn_detection?: any;
} = null;

const ttsListeners: Record<TtsEventName, Set<TtsEventHandler>> = {
  "tts.start": new Set<TtsEventHandler>(),
  "tts.delta": new Set<TtsEventHandler>(),
  "tts.end": new Set<TtsEventHandler>(),
};

function emitTts(event: TtsEventName, payload?: any): void {
  const ls = ttsListeners[event];
  if (!ls) return;
  ls.forEach((fn) => {
    try {
      fn(payload);
    } catch {}
  });
}

export function onTts(
  event: TtsEventName,
  handler: TtsEventHandler
): () => void {
  ttsListeners[event].add(handler);
  return () => ttsListeners[event].delete(handler);
}

type ToolEventHandler = (payload: {
  name: string;
  arguments: any;
  call_id?: string;
}) => void;
const toolListeners = new Set<ToolEventHandler>();
export function onToolCall(handler: ToolEventHandler): () => void {
  toolListeners.add(handler);
  return () => toolListeners.delete(handler);
}
function emitToolCall(payload: {
  name: string;
  arguments: any;
  call_id?: string;
}) {
  toolListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {}
  });
}

let sessionInstructions = [
  "You are Taki, a cheerful female bunny tutor mascot.",
  "Speak English only. Keep it friendly, energetic, and playful.",
  "Use short sentences (7–12 words) and a slightly higher pitch.",
  "Stay natural and not overly cutesy. Keep pace comfortable.",
  "Sound like you are talking to a friend while teaching.",
].join(" ");

function unlockAudio(): void {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
  } catch {}
}

async function getSessionToken(
  payload?: Partial<{ model: string; voice: string; instructions: string }>
): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/api/tts/session-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: payload?.model || "gpt-4o-realtime-preview-2024-12-17",
        voice: payload?.voice || sessionVoice,
        instructions: payload?.instructions || sessionInstructions,
        ...(sessionTools?.tools ? { tools: sessionTools.tools } : {}),
        ...(sessionTools?.tool_choice
          ? { tool_choice: sessionTools.tool_choice }
          : {}),
        ...(sessionTools?.turn_detection
          ? { turn_detection: sessionTools.turn_detection }
          : {}),
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.client_secret?.value || null;
  } catch {
    return null;
  }
}

async function ensureRealtime(): Promise<boolean> {
  if (ready && pc && dc) return true;
  const key = await getSessionToken();
  if (!key) return false;
  try {
    pc = new RTCPeerConnection();
    // Remote audio sink
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    (audioEl as any).playsInline = true;
    audioEl.muted = false;
    audioEl.style.display = "none";
    try {
      document.body.appendChild(audioEl);
    } catch {}
    pc.ontrack = (e) => {
      if (audioEl) {
        audioEl.srcObject = e.streams[0];
        const p = (audioEl as HTMLAudioElement).play();
        if (p && typeof (p as any).catch === "function") {
          (p as Promise<void>).catch(() => {});
        }
      }
    };

    // Add local mic track to negotiate audio m-line (recv remote audio)
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = ms.getTracks()[0];
      if (track) pc.addTrack(track, ms);
    } catch {
      // mic unavailable; still try without sending local audio
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
      } catch {}
    }

    // Data channel for events
    dc = pc.createDataChannel("oai-events");
    dcOpenPromise = new Promise<void>((resolve) => {
      dc!.addEventListener("open", () => {
        ready = true;
        resolve();
      });
    });
    dc.addEventListener("message", (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data);
        if (
          event?.type === "response.audio_transcript.delta" &&
          event?.transcript
        ) {
          emitTts("tts.delta", { transcript: event.transcript });
        }
        if (event?.type === "output_audio_buffer.stopped") {
          emitTts("tts.end");
        }
        if (event?.type === "response.done" && event?.response?.output) {
          const outputs = event.response.output as any[];
          outputs.forEach((out) => {
            if (out?.type === "function_call") {
              const name = out.name;
              let args: any = {};
              try {
                args =
                  typeof out.arguments === "string"
                    ? JSON.parse(out.arguments)
                    : out.arguments || {};
              } catch {}
              emitToolCall({ name, arguments: args, call_id: out.call_id });
            }
          });
        }
      } catch {}
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResp = await fetch(
      `https://api.openai.com/v1/realtime?model=${model}`,
      {
        method: "POST",
        body: offer.sdp as any,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
        },
      }
    );
    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: await sdpResp.text(),
    };
    await pc.setRemoteDescription(answer);
    return true;
  } catch {
    return false;
  }
}

export async function speakRealtime(text: string): Promise<boolean> {
  const ok = await ensureRealtime();
  if (!ok || !dc) return false;
  try {
    // wait DC open if needed
    if (dc.readyState !== "open" && dcOpenPromise) {
      await Promise.race([
        dcOpenPromise,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("dc open timeout")), 4000)
        ),
      ]);
    }
    if (dc.readyState !== "open") return false;
    emitTts("tts.start");
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      })
    );
    dc.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions:
            "Read the previous user message aloud in your configured friendly, playful style.",
        },
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function teardownRealtime(): void {
  try {
    dc?.close();
  } catch {}
  try {
    pc?.getSenders().forEach((s) => s.track && s.track.stop());
    pc?.close();
  } catch {}
  dc = null;
  pc = null;
  ready = false;
  if (audioEl) {
    try {
      (audioEl.srcObject as MediaStream | null) = null;
    } catch {}
    try {
      document.body.removeChild(audioEl);
    } catch {}
    audioEl = null;
  }
  dcOpenPromise = null;
}

export function speakNative(text: string): boolean {
  try {
    const u = new SpeechSynthesisUtterance(text);
    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const preferred =
        voices.find(
          (v) =>
            /en/i.test(v.lang) &&
            /female|samantha|victoria|karen|zira|lisa|eva|serena|allison|susan|olivia/i.test(
              v.name
            )
        ) || voices.find((v) => /en/i.test(v.lang));
      if (preferred) u.voice = preferred;
      u.pitch = 1.15; // slightly higher pitch
      u.rate = 0.95; // comfortable pace
    } catch {}
    u.onstart = () => emitTts("tts.start");
    u.onend = () => emitTts("tts.end");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export async function speakText(
  text: string,
  prefer: TtsMode = "realtime"
): Promise<"realtime" | "native" | "failed"> {
  if (!text) return "failed";
  if (prefer === "realtime") {
    const ok = await speakRealtime(text);
    if (ok) return "realtime";
    const n = speakNative(text);
    return n ? "native" : "failed";
  } else {
    const n = speakNative(text);
    if (n) return "native";
    const ok = await speakRealtime(text);
    return ok ? "realtime" : "failed";
  }
}

export async function prewarmRealtime(): Promise<boolean> {
  if (!audioUnlocked) unlockAudio();
  const ok = await ensureRealtime();
  return ok;
}

export function setTtsStyle(
  style: Partial<{ voice: string; instructions: string }>
) {
  if (style.voice) sessionVoice = style.voice;
  if (style.instructions) sessionInstructions = style.instructions;
  // Recreate session next time with new style
  try {
    teardownRealtime();
  } catch {}
}

export function setRealtimeTools(config: {
  tools?: any[];
  tool_choice?: string;
  turn_detection?: any;
}) {
  sessionTools = config || null;
  try {
    teardownRealtime();
  } catch {}
}

export function sendRealtimeEvent(message: any): boolean {
  try {
    if (!dc || dc.readyState !== "open") return false;
    dc.send(JSON.stringify(message));
    return true;
  } catch {
    return false;
  }
}

export function sendToolOutput(callId: string, output: string): boolean {
  if (!callId) return false;
  const ok = sendRealtimeEvent({
    type: "conversation.item.create",
    item: { type: "function_call_output", call_id: callId, output },
  });
  // Optionally request a response afterwards
  sendRealtimeEvent({
    type: "response.create",
    response: { instructions: "Acknowledge the user’s action briefly." },
  });
  return ok;
}

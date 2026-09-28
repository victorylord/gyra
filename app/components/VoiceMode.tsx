"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceSettings, resolveVoice } from "./voiceSettings";

type VoiceModeState =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

type VoiceModeProps = {
  open: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  getLatestAssistantReply: () => Promise<string | null>;
};

// ---------- Tuning ----------
const SILENCE_RMS = 0.020;          // lower = picks up quieter speech
const SILENCE_MS = 10000;            // wait 3s of silence before stopping
const MIN_SPEECH_MS = 800;          // ignore <0.8s blips
const MAX_RECORD_MS = 90_000;       // hard cap
const MIN_BLOB_BYTES = 3000;        // ~0.5s of webm/opus
const START_GRACE_MS = 5500;        // don't count silence in the first 1.5s

export default function VoiceMode({
  open,
  onClose,
  onTranscript,
  getLatestAssistantReply,
}: VoiceModeProps) {
  const [state, setState] = useState<VoiceModeState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  const [volume, setVolume] = useState(0); // 0..1 for the "heard you" ring
  const { settings } = useVoiceSettings();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef = useRef<number>(0);
  const hardStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef<boolean>(false);
  const openRef = useRef<boolean>(open);
  const hasSpokenRef = useRef<boolean>(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // ---------- cleanup ----------
  const teardownAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (hardStopRef.current) clearTimeout(hardStopRef.current);
    hardStopRef.current = null;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolume(0);
  }, []);

  useEffect(() => {
    if (!open) {
      teardownAudio();
      setState("idle");
      setPartial("");
      setReplyText("");
      setError(null);
      hasSpokenRef.current = false;
    }
  }, [open, teardownAudio]);

  // ---------- visualizer ----------
  const drawBars = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (
      canvas.width !== rect.width * dpr ||
      canvas.height !== rect.height * dpr
    ) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width;
    const H = rect.height;
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      analyser.getByteFrequencyData(data);

      // Overall loudness for the "heard you" ring
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += data[i];
      const avg = sum / bufferLength / 255;
      setVolume(avg);

      ctx.clearRect(0, 0, W, H);

      const barCount = 64;
      const step = Math.max(1, Math.floor(bufferLength / barCount));
      const barW = W / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        let s = 0;
        for (let j = 0; j < step; j++) s += data[i * step + j];
        const a = s / step / 255;

        const h = Math.max(4, a * H * 0.9);
        const x = i * barW + gap / 2;
        const y = (H - h) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "rgba(96, 165, 250, 1)");
        grad.addColorStop(0.5, "rgba(59, 130, 246, 1)");
        grad.addColorStop(1, "rgba(37, 99, 235, 0.6)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        const r = Math.min(barW / 2 - gap / 2, 6);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + barW - gap, y, x + barW - gap, y + h, r);
        ctx.arcTo(x + barW - gap, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + barW - gap, y, r);
        ctx.closePath();
        ctx.fill();
      }
    };
    loop();
  }, []);

  // ---------- stop recording ----------
  const stopRecording = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  // ---------- speak ----------
  const speakText = useCallback(
    (
      text: string,
      voiceId: "ara" | "james",
      rate: number,
      pitch: number
    ) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();

        const doSpeak = () => {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = rate;
          u.pitch = pitch;
          const voice = resolveVoice(
            window.speechSynthesis.getVoices(),
            voiceId
          );
          if (voice) u.voice = voice;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          const onVoices = () => {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
          };
          window.speechSynthesis.onvoiceschanged = onVoices;
          setTimeout(() => {
            if (window.speechSynthesis.onvoiceschanged) {
              window.speechSynthesis.onvoiceschanged = null;
              doSpeak();
            }
          }, 500);
        } else {
          doSpeak();
        }
      }),
    []
  );

  // ---------- start recording ----------
  const startListening = useCallback(async () => {
    setError(null);
    setPartial("");
    setReplyText("");
    stoppedRef.current = false;
    hasSpokenRef.current = false;
    speechStartRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new AudioCtx();
      audioCtxRef.current = audioCtx;

      // Some browsers suspend the context until a user gesture
      if (audioCtx.state === "suspended") {
        await audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const mimeType =
        mimeCandidates.find(
          (m) =>
            typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported(m)
        ) || "";

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (blob.size < MIN_BLOB_BYTES || !hasSpokenRef.current) {
          setError(
            "I didn't catch that. Hold on, tap Try again, and speak a full sentence."
          );
          setState("error");
          teardownAudio();
          return;
        }

        setState("transcribing");
        try {
          const form = new FormData();
          const rawType = recorder.mimeType || "audio/webm";
          const ext = rawType.includes("mp4")
            ? "mp4"
            : rawType.includes("ogg")
            ? "ogg"
            : "webm";
          form.append("audio", blob, `speech.${ext}`);

          const res = await fetch("/api/v1/transcribe", {
            method: "POST",
            body: form,
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data?.text) {
            setError(
              data?.error?.message ||
                "Couldn't transcribe that. Please try again."
            );
            setState("error");
            teardownAudio();
            return;
          }

          const transcript = String(data.text).trim();
          if (!transcript) {
            setError("I couldn't hear any words. Try again.");
            setState("error");
            teardownAudio();
            return;
          }
          setPartial(transcript);

          setState("thinking");
          onTranscript(transcript);

          const reply = await getLatestAssistantReply();
          teardownAudio();

          if (!reply) {
            setError("Gyra didn't respond. Please try again.");
            setState("error");
            return;
          }

          setReplyText(reply);
          setState("speaking");

          await speakText(
            reply,
            settings.voiceId,
            settings.rate,
            settings.pitch
          );

          setState("idle");
          setTimeout(() => {
            if (openRef.current) startListening();
          }, 600);
        } catch (err) {
          console.error(err);
          setError("Something went wrong. Please try again.");
          setState("error");
          teardownAudio();
        }
      };

      recorder.start(250); // emit data every 250ms so nothing is lost
      setState("listening");
      drawBars();

      // Track the time we started, for the grace period
      const startedAt = Date.now();

      const detectSilence = () => {
        if (!analyserRef.current || stoppedRef.current) return;
        const buf = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(buf);

        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);

        if (rms > SILENCE_RMS) {
          // heard something
          hasSpokenRef.current = true;
          if (speechStartRef.current === 0)
            speechStartRef.current = Date.now();
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          const withinGrace = Date.now() - startedAt < START_GRACE_MS;
          const spokeLongEnough =
            speechStartRef.current > 0 &&
            Date.now() - speechStartRef.current > MIN_SPEECH_MS;

          if (
            !withinGrace &&
            spokeLongEnough &&
            !silenceTimerRef.current
          ) {
            silenceTimerRef.current = setTimeout(() => {
              stopRecording();
            }, SILENCE_MS);
          }
        }

        requestAnimationFrame(detectSilence);
      };
      requestAnimationFrame(detectSilence);

      hardStopRef.current = setTimeout(() => stopRecording(), MAX_RECORD_MS);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.name === "NotAllowedError"
          ? "Microphone permission was denied. Enable it in your browser settings."
          : "Could not access your microphone.";
      setError(msg);
      setState("error");
      teardownAudio();
    }
  }, [
    drawBars,
    stopRecording,
    teardownAudio,
    onTranscript,
    getLatestAssistantReply,
    settings,
    speakText,
  ]);

  const handleCancel = () => {
    stoppedRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    teardownAudio();
    onClose();
  };

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => startListening(), 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const statusLabel = (() => {
    switch (state) {
      case "listening":
        return hasSpokenRef.current
          ? "Listening… (tap ✓ when done)"
          : "I'm listening — speak now";
      case "transcribing":
        return "Understanding…";
      case "thinking":
        return "Gyra is thinking…";
      case "speaking":
        return "Gyra is speaking…";
      case "error":
        return "Something went wrong";
      default:
        return "Starting…";
    }
  })();

  return (
    <div className="fixed inset-0 z-[65] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center px-6">
      <button
        onClick={handleCancel}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        aria-label="Close voice mode"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <p className="text-sm text-zinc-400 tracking-wide mb-6">{statusLabel}</p>

      <div className="relative w-full max-w-2xl h-40 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: state === "listening" ? "block" : "none" }}
        />
        {state !== "listening" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-blue-500/40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 animate-pulse flex items-center justify-center">
                <span className="text-2xl">
                  {state === "speaking"
                    ? "🔊"
                    : state === "error"
                    ? "⚠️"
                    : "🧠"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* "I heard you" ring — grows with volume */}
      {state === "listening" && (
        <div className="mt-2 h-2 w-40 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-[width] duration-75"
            style={{ width: `${Math.min(100, volume * 400)}%` }}
          />
        </div>
      )}

      <div className="mt-6 w-full max-w-xl text-center min-h-[80px]">
        {partial && (
          <p className="text-base text-zinc-200 leading-relaxed">
            <span className="text-zinc-500">You said: </span>
            {partial}
          </p>
        )}
        {replyText && (
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed line-clamp-4">
            {replyText}
          </p>
        )}
        {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {state === "error" ? (
          <>
            <button
              onClick={() => {
                setState("idle");
                startListening();
              }}
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </>
        ) : state === "listening" ? (
          // Manual "Done" button — no more waiting for silence
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors shadow-lg shadow-blue-500/30"
            aria-label="Send now"
            title="Tap when you're done speaking"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="w-16 h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors"
            aria-label="Stop"
          >
            <div className="w-5 h-5 bg-red-500 rounded-sm" />
          </button>
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-600 text-center max-w-sm">
        {state === "listening"
          ? "Speak a full sentence. Tap the ✓ when you're done, or just pause for 3 seconds."
          : "Speak naturally. Gyra will reply and keep the conversation going."}
      </p>
    </div>
  );
}
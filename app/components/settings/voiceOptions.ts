import type { VoiceId } from "../voiceSettings";

export type VoiceOption = {
  id: VoiceId;
  name: string;
  tagline: string;
  /** CSS gradient for the blurred avatar */
  gradient: string;
  /** Emoji fallback when gradients aren't supported */
  emoji: string;
};

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "ara",
    name: "Ara",
    tagline: "Warm & Natural",
    gradient:
      "radial-gradient(circle at 30% 30%, #60a5fa, #1e3a8a 70%, #0f172a)",
    emoji: "👩",
  },
  {
    id: "james",
    name: "James",
    tagline: "Deep & Confident",
    gradient:
      "radial-gradient(circle at 30% 30%, #a1a1aa, #3f3f46 70%, #18181b)",
    emoji: "👨",
  },
  {
    id: "nova",
    name: "Nova",
    tagline: "Bright & Playful",
    gradient:
      "radial-gradient(circle at 30% 30%, #a78bfa, #6d28d9 70%, #1e1b4b)",
    emoji: "✨",
  },
  {
    id: "sage",
    name: "Sage",
    tagline: "Calm & Measured",
    gradient:
      "radial-gradient(circle at 30% 30%, #86efac, #15803d 70%, #052e16)",
    emoji: "🌿",
  },
];
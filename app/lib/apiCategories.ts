export type ApiCategoryStatus = "live" | "beta" | "coming-soon";

export type ApiTool = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  status: ApiCategoryStatus;
};

export type ApiCategory = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: ApiCategoryStatus;
  color: string;
  icon: string;
  docsHref: string;
  keyHref: string;
  tools: ApiTool[];
  pricing: string;
};

export const API_CATEGORIES: ApiCategory[] = [
  {
    id: "ai",
    name: "Gyra AI API",
    tagline: "Chat, vision, files, voice",
    description:
      "The core intelligence layer. Open AI-compatible endpoints for chat completions, vision analysis, file intelligence, and voice synthesis. Free tier included. Built for developers who want an OpenAI-shaped API that understands Nigeria.",
    status: "live",
    color: "blue",
    icon: "🧠",
    docsHref: "/docs",
    keyHref: "/api-keys",
    pricing: "Free · Pay-per-use for video & voice",
    tools: [
      {
        id: "chat",
        name: "Chat Completions",
        description: "Streaming chat with any Gyra model",
        endpoint: "/api/v1/chat",
        method: "POST",
        status: "live",
      },
      {
        id: "vision",
        name: "Vision Analysis",
        description: "Understand images, charts, and screenshots",
        endpoint: "/api/v1/chat",
        method: "POST",
        status: "live",
      },
      {
        id: "files",
        name: "File Intelligence",
        description: "Read PDFs, DOCX, XLSX, and images",
        endpoint: "/api/v1/chat",
        method: "POST",
        status: "live",
      },
      {
        id: "transcribe",
        name: "Speech-to-Text",
        description: "Whisper transcription with Nigerian accents",
        endpoint: "/api/v1/transcribe",
        method: "POST",
        status: "live",
      },
      {
        id: "voice",
        name: "Voice Synthesis",
        description: "Natural speech from text",
        endpoint: "/api/v1/voice",
        method: "POST",
        status: "live",
      },
      {
        id: "video",
        name: "Video Generation",
        description: "Text-to-video with cinematic quality",
        endpoint: "/api/v1/video/generate",
        method: "POST",
        status: "live",
      },
    ],
  },
  {
    id: "media",
    name: "Gyra Media API",
    tagline: "Transcription, metadata, music",
    description:
      "A unified media intelligence layer. Transcribe YouTube, TikTok, and Instagram videos. Extract metadata, thumbnails, and statistics. Search music across Spotify, MusicBrainz, and Last.fm. Summarize content with AI. Built for legitimate developer workflows — accessibility, research, and content intelligence.",
    status: "coming-soon",
    color: "purple",
    icon: "🎬",
    docsHref: "/docs/media",
    keyHref: "/api-keys?category=media",
    pricing: "$0.90 per request",
    tools: [
      {
        id: "transcribe-yt",
        name: "YouTube Transcripts",
        description: "Public captions with timestamp segments",
        endpoint: "/api/v1/media/youtube/transcript",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "transcribe-tiktok",
        name: "TikTok Transcription",
        description: "AI transcription of public TikTok videos",
        endpoint: "/api/v1/media/tiktok/transcribe",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "video-summary",
        name: "Video Summaries",
        description: "AI-generated summaries with key moments",
        endpoint: "/api/v1/media/summarize",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "metadata",
        name: "Media Metadata",
        description: "Title, description, creator, thumbnail",
        endpoint: "/api/v1/media/metadata",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "spotify-search",
        name: "Music Search",
        description: "Search tracks, artists, and albums",
        endpoint: "/api/v1/media/music/search",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "music-metadata",
        name: "Music Metadata",
        description: "Full track info with artwork",
        endpoint: "/api/v1/media/music/metadata",
        method: "POST",
        status: "coming-soon",
      },
    ],
  },
  {
    id: "network",
    name: "Gyra Network API",
    tagline: "IP, DNS, WHOIS, screenshots",
    description:
      "Everything a developer needs to inspect the internet. IP geolocation, DNS records, WHOIS lookups, SSL certificates, website screenshots, headers, and uptime checks. One key. Ten endpoints. No scraping required.",
    status: "coming-soon",
    color: "cyan",
    icon: "🌐",
    docsHref: "/docs/network",
    keyHref: "/api-keys?category=network",
    pricing: "Free tier · $0.05 per request",
    tools: [
      {
        id: "ip-lookup",
        name: "IP Lookup",
        description: "Geolocation, ISP, and ASN info",
        endpoint: "/api/v1/network/ip",
        method: "GET",
        status: "coming-soon",
      },
      {
        id: "dns",
        name: "DNS Lookup",
        description: "A, AAAA, MX, TXT, NS, CNAME records",
        endpoint: "/api/v1/network/dns",
        method: "GET",
        status: "coming-soon",
      },
      {
        id: "whois",
        name: "WHOIS Lookup",
        description: "Domain registration information",
        endpoint: "/api/v1/network/whois",
        method: "GET",
        status: "coming-soon",
      },
      {
        id: "ssl",
        name: "SSL Certificate Check",
        description: "Certificate details, issuer, expiry",
        endpoint: "/api/v1/network/ssl",
        method: "GET",
        status: "coming-soon",
      },
      {
        id: "screenshot",
        name: "Website Screenshot",
        description: "PNG capture of any public webpage",
        endpoint: "/api/v1/network/screenshot",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "headers",
        name: "HTTP Headers",
        description: "Inspect headers, redirects, and status",
        endpoint: "/api/v1/network/headers",
        method: "GET",
        status: "coming-soon",
      },
    ],
  },
  {
    id: "utilities",
    name: "Gyra Utilities API",
    tagline: "Convert, compress, generate",
    description:
      "The kitchen sink for everyday developer tasks. File conversion, image resizing, QR generation, URL safety, and document extraction. Modular services you can enable individually.",
    status: "coming-soon",
    color: "amber",
    icon: "🛠️",
    docsHref: "/docs/utilities",
    keyHref: "/api-keys?category=utilities",
    pricing: "Free tier · $0.02 per request",
    tools: [
      {
        id: "convert",
        name: "File Conversion",
        description: "PDF, DOCX, XLSX, images",
        endpoint: "/api/v1/utils/convert",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "image",
        name: "Image Tools",
        description: "Resize, compress, metadata",
        endpoint: "/api/v1/utils/image",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "qr",
        name: "QR Codes",
        description: "Generate and scan QR codes",
        endpoint: "/api/v1/utils/qr",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "safe-url",
        name: "URL Safety",
        description: "Domain reputation and safety check",
        endpoint: "/api/v1/utils/url-safety",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "tts",
        name: "Text-to-Speech",
        description: "Natural voice from text",
        endpoint: "/api/v1/utils/tts",
        method: "POST",
        status: "coming-soon",
      },
      {
        id: "summarize",
        name: "Web Summarizer",
        description: "Extract and summarize any webpage",
        endpoint: "/api/v1/utils/summarize",
        method: "POST",
        status: "coming-soon",
      },
    ],
  },
];

export function getCategory(id: string): ApiCategory | undefined {
  return API_CATEGORIES.find((c) => c.id === id);
}
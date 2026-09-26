"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import Image from "next/image";

// ============================================================
// MessageContent — renders AI replies with code block support
// ============================================================
function MessageContent({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parts: { type: "text" | "code"; content: string; language?: string }[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "code",
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={i} className="whitespace-pre-wrap leading-relaxed">
              {part.content}
            </div>
          );
        }
        return (
          <div
            key={i}
            className="bg-black border border-zinc-700 rounded-xl overflow-hidden my-2"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-950">
              <span className="text-xs text-zinc-500 font-mono">
                {part.language}
              </span>
              <button
                onClick={() => copyToClipboard(part.content, i)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-800 transition-colors"
              >
                {copiedIndex === i ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre">
              {part.content}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================
export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showToS, setShowToS] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsSubPage, setSettingsSubPage] = useState<string | null>(null);

  // Chat state
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  // Think + Search
  const [thinkMode, setThinkMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Broadcast
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  // Settings
  const [setTimeZone, setSetTimeZone] = useState(true);
  const [kidsMode, setKidsMode] = useState(false);
  const [nsfwMode, setNsfwMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState("Ara");
  const [theme, setTheme] = useState("System");
  const [language, setLanguage] = useState("English");
  const [haptics, setHaptics] = useState(true);
  const [responseStyle, setResponseStyle] = useState("Balanced");
  const [gyraStyle, setGyraStyle] = useState("Default");
  const [gyraCustomPrompt, setGyraCustomPrompt] = useState("");
  const [typeheads, setTypeheads] = useState(true);
  const [replySuggestions, setReplySuggestions] = useState(true);
  const [thinkHarder, setThinkHarder] = useState(true);
  const [shakeToReport, setShakeToReport] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user + chats
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: chatsData } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (chatsData) {
          setChats(chatsData);
          if (chatsData.length > 0) {
            setActiveChatId(chatsData[0].id);
            await loadMessages(chatsData[0].id);
          }
        }
      }

      try {
        const { data: bc } = await supabase
          .from("broadcasts")
          .select("*")
          .eq("active", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (bc && bc[0]) setActiveBroadcast(bc[0]);
      } catch (e) {}
    };
    init();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
    }
  };

  const createNewChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .insert([{ user_id: user.id, title: "New Conversation" }])
      .select()
      .single();
    if (data) {
      setChats([data, ...chats]);
      setActiveChatId(data.id);
      setMessages([]);
      setIsSidebarOpen(false);
    }
  };

  const selectChat = async (id: string) => {
    setActiveChatId(id);
    setMessages([]);
    setIsSidebarOpen(false);
    await loadMessages(id);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    let chatId = activeChatId;
    if (!chatId) {
      if (!user) return;
      const { data } = await supabase
        .from("chats")
        .insert([{ user_id: user.id, title: "New Conversation" }])
        .select()
        .single();
      if (!data) return;
      setChats([data, ...chats]);
      setActiveChatId(data.id);
      chatId = data.id;
    }

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    await supabase.from("messages").insert([
      { chat_id: chatId, role: "user", content: currentInput },
    ]);

    if (messages.length === 0) {
      const newTitle =
        currentInput.substring(0, 25) + (currentInput.length > 25 ? "..." : "");
      await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
      setChats(chats.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)));
    }

    setMessages([...updatedMessages, { role: "assistant", content: "" }]);

    // Compose the message with style + custom prompt + language prefix
    let stylePrefix = "";
    if (gyraStyle && gyraStyle !== "Default") {
      stylePrefix += `Response style: ${gyraStyle}. `;
    }
    if (gyraCustomPrompt?.trim()) {
      stylePrefix += `Custom instructions: ${gyraCustomPrompt.trim()}. `;
    }
    if (language && language !== "English") {
      stylePrefix += `Always respond in ${language}. `;
    }

    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content:
        stylePrefix && m === updatedMessages[updatedMessages.length - 1]
          ? `[${stylePrefix.trim()}]\n\n${m.content}`
          : m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          think: thinkMode,
          search: searchMode,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              fullReply += parsed.token;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: fullReply };
                return next;
              });
            }
            if (parsed.done) {
              await supabase.from("messages").insert([
                { chat_id: chatId, role: "assistant", content: fullReply },
              ]);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, I ran into an error. Please try again.",
        };
        return next;
      });
    }
    setLoading(false);
  };

  const deleteChat = async (id: string) => {
    await supabase.from("chats").delete().eq("id", id);
    setChats(chats.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }
    setActiveChatMenu(null);
  };

  const renameChat = async (id: string) => {
    const newTitle = window.prompt("Rename conversation:");
    if (newTitle && newTitle.trim()) {
      await supabase.from("chats").update({ title: newTitle }).eq("id", id);
      setChats(chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    }
    setActiveChatMenu(null);
  };

  const pinChat = async (id: string, currentPinStatus: boolean) => {
    const newPinStatus = !currentPinStatus;
    await supabase.from("chats").update({ pinned: newPinStatus }).eq("id", id);
    const updatedChats = chats.map((c) =>
      c.id === id ? { ...c, pinned: newPinStatus } : c
    );
    updatedChats.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setChats(updatedChats);
    setActiveChatMenu(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const settingsRow = (label: string, icon: string, sub?: string, key?: string) => (
    <button
      key={label}
      onClick={() => key && setSettingsSubPage(key)}
      className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-left"
    >
      <span className="w-6 h-6 flex items-center justify-center text-zinc-400 text-sm">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
      <svg
        className="w-4 h-4 text-zinc-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );

  const settingsToggle = (
    label: string,
    icon: string,
    sub: string | undefined,
    value: boolean,
    setValue: (v: boolean) => void
  ) => (
    <div
      key={label}
      className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 flex items-center justify-center text-zinc-400 text-sm">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        </div>
      </div>
      <button
        onClick={() => setValue(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
          value ? "bg-white" : "bg-zinc-700"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
            value ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  // ============================================================
  // RENDER SETTINGS SUB-PAGE
  // ============================================================
  const renderSettingsSubPage = () => {
    switch (settingsSubPage) {
      case "Appearance":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 mb-2">
              Choose how Gyra looks on your device.
            </p>
            {["System", "Dark", "Light"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  theme === t
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium">{t}</span>
                {theme === t && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        );

      case "Haptics":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 mb-2">Vibrate on interactions.</p>
            {settingsToggle("Enable Haptics", "📳", "Master toggle", haptics, setHaptics)}
          </div>
        );

      case "Notifications":
        return (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="font-semibold mb-2">Notifications</p>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Get notified when Gyra finishes thinking on long-running tasks.
            </p>
            <span className="mt-6 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Coming in next update
            </span>
          </div>
        );

      case "Advanced":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 mb-2">Power user options.</p>
            {settingsToggle("Typeheads", "⌨️", "Show completions as you type", typeheads, setTypeheads)}
            {settingsToggle("Reply suggestions", "💡", "Show follow-up replies", replySuggestions, setReplySuggestions)}
            {settingsToggle("Think harder", "🧠", "Re-answer with more reasoning", thinkHarder, setThinkHarder)}
            {settingsToggle("Shake to report", "🚩", "Shake device to report a bug", shakeToReport, setShakeToReport)}
          </div>
        );

      case "Widget":
        return (
          <div className="text-zinc-300 flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <span className="text-2xl">🧩</span>
            </div>
            <p className="font-semibold mb-2">Home Screen Widget</p>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
              Quick access to Gyra from your home screen.
            </p>
            <div className="text-xs text-zinc-400 text-left bg-zinc-900 rounded-xl p-4 max-w-xs">
              <p className="mb-2">1. Long-press empty space</p>
              <p className="mb-2">2. Tap &quot;Widgets&quot;</p>
              <p className="mb-2">3. Find &quot;Gyra&quot;</p>
              <p className="mb-2">4. Choose a size</p>
              <p>5. Tap &quot;Add Widget&quot;</p>
            </div>
          </div>
        );

      case "Customize Gyra":
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400">Choose how Gyra responds.</p>
            {["Default", "Balanced", "Concise", "Detailed", "Creative", "Professional"].map((s) => (
              <button
                key={s}
                onClick={() => setGyraStyle(s)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  gyraStyle === s
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium">{s}</span>
                {gyraStyle === s && <span className="text-lg">✓</span>}
              </button>
            ))}
            <p className="text-sm text-zinc-400 mt-4">Custom instructions:</p>
            <textarea
              value={gyraCustomPrompt}
              onChange={(e) => setGyraCustomPrompt(e.target.value)}
              rows={4}
              placeholder="Tell Gyra how to respond..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-zinc-500">
              Changes apply to new messages.
            </p>
          </div>
        );

      case "Language":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 mb-2">
              Gyra will respond in your selected language.
            </p>
            {[
              "English", "Español", "Français", "Deutsch", "Português", "Italiano",
              "العربية", "हिन्दी", "日本語", "한국어", "中文", "Русский",
              "Yoruba", "Igbo", "Hausa", "Swahili", "Zulu", "Afrikaans",
            ].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  language === lang
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium">{lang}</span>
                {language === lang && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        );

      case "Voice":
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 mb-2">Choose your voice.</p>
            {["Ara", "Nova", "Atlas", "Juno", "Sage"].map((v) => (
              <button
                key={v}
                onClick={() => setVoiceMode(v)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  voiceMode === v
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium">{v}</span>
                {voiceMode === v && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        );

      case "Report a Problem":
        return (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <span className="text-2xl">🚩</span>
            </div>
            <p className="font-semibold mb-2">Report a problem</p>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
              Found a bug? Let us know.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a
                href="mailto:support@gyra.ng?subject=Bug%20Report"
                className="bg-white text-black py-3 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors"
              >
                Email support@gyra.ng
              </a>
              <a
                href="https://t.me/Gyra_AiBot"
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-900 border border-zinc-800 py-3 rounded-full font-medium text-sm hover:bg-zinc-800 transition-colors"
              >
                Telegram @Gyra_AiBot
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      {/* Broadcast Banner */}
      {activeBroadcast && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[calc(100%-2rem)] rounded-2xl border p-4 shadow-2xl ${
            activeBroadcast.type === "alert"
              ? "bg-red-950/95 border-red-500/50"
              : activeBroadcast.type === "warning"
              ? "bg-yellow-950/95 border-yellow-500/50"
              : activeBroadcast.type === "success"
              ? "bg-green-950/95 border-green-500/50"
              : "bg-blue-950/95 border-blue-500/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📢</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{activeBroadcast.title}</p>
              <p className="text-xs text-zinc-300 mt-1">{activeBroadcast.message}</p>
            </div>
            <button
              onClick={() => setActiveBroadcast(null)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TOS Modal */}
      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">
              Updates to our Terms of Service
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We&apos;re updating our Terms of Service and Acceptable Use
              Policy. Now&apos;s a great chance to review them.
            </p>
            <button
              onClick={() => setShowToS(false)}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black z-[70] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50 shrink-0">
            {settingsSubPage ? (
              <button
                onClick={() => setSettingsSubPage(null)}
                className="text-zinc-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold">{settingsSubPage || "Settings"}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {settingsSubPage ? (
              renderSettingsSubPage()
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl mb-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold">
                    {user ? user.email[0].toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {user ? user.email.split("@")[0] : "Loading..."}
                    </p>
                    <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowUpgrade(true);
                  }}
                  className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 mb-6"
                >
                  <Image src="/logo.jpeg" alt="Gyra" width={32} height={32} className="rounded-full" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">SuperGyra</p>
                    <p className="text-xs text-zinc-500">Premium Ask, Voice, Imagine...</p>
                  </div>
                  <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                    Upgrade
                  </span>
                </button>

                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">App</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Appearance", "🌗", theme, "Appearance")}
                  {settingsRow("Haptics", "📳", haptics ? "On" : "Off", "Haptics")}
                  {settingsRow("Notifications", "🔔", "Coming soon", "Notifications")}
                  {settingsRow("Widget", "🧩", undefined, "Widget")}
                  {settingsRow("Advanced", "⚙️", undefined, "Advanced")}
                </div>

                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Gyra</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Customize Gyra", "🎨", gyraStyle, "Customize Gyra")}
                  {settingsRow("Language", "🌐", language, "Language")}
                  {settingsRow("Voice", "🎤", voiceMode, "Voice")}
                </div>

                <div className="flex flex-col gap-1 mb-6">
                  {settingsToggle("Kids Mode", "⭐", "Filter responses", kidsMode, setKidsMode)}
                  {settingsToggle("NSFW Preferences", "🔞", "Allow mature content", nsfwMode, setNsfwMode)}
                </div>

                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Bot</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsToggle(
                    "Set time zone automatically",
                    "🕒",
                    "Follow this device",
                    setTimeZone,
                    setSetTimeZone
                  )}
                  {settingsRow("Time zone", "🌍", "Africa/Lagos")}
                </div>

                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">
                  Data & Information
                </p>
                <div className="flex flex-col gap-1 mb-6">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-zinc-400 text-sm">
                      📋
                    </span>
                    <p className="text-sm font-medium flex-1">Terms of Use</p>
                    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-zinc-400 text-sm">
                      🔒
                    </span>
                    <p className="text-sm font-medium flex-1">Privacy Policy</p>
                    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  {settingsRow("Report a Problem", "🚩", undefined, "Report a Problem")}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-red-500"
                >
                  <span className="w-6 h-6 flex items-center justify-center">🚪</span>
                  <p className="text-sm font-medium">Sign out</p>
                </button>

                <p className="text-center text-xs text-zinc-600 mt-6 mb-4">
                  Gyra 1.0.0 · Made by Victory Lord
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="absolute inset-0 bg-black z-[75] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => setShowUpgrade(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h2 className="text-2xl font-bold text-center mb-2">
              Keep chatting with basic access
            </h2>
            <p className="text-zinc-400 text-center text-sm mb-6">
              Choose the right plan for you
            </p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-full p-1 mb-6 overflow-x-auto">
              {["Lite", "SuperGyra", "Plus", "Heavy"].map((tier, i) => (
                <button
                  key={tier}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium whitespace-nowrap ${
                    i === 0 ? "bg-zinc-800 text-white" : "text-zinc-500"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">
                SuperGyra <span className="text-zinc-500 font-normal">Lite</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="border-2 border-blue-500 bg-blue-500/10 rounded-xl p-4 text-left">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold">₦10,000.00</p>
                  <p className="text-xs text-zinc-500">Billed monthly</p>
                </button>
                <button className="border border-zinc-800 rounded-xl p-4 text-left relative">
                  <span className="absolute top-2 right-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    Save 17%
                  </span>
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-700 mb-2"></div>
                  <p className="text-lg font-bold">₦118,800.00</p>
                  <p className="text-xs text-zinc-500">Billed yearly</p>
                </button>
              </div>
              <button
                onClick={() => alert("Payments coming soon!")}
                className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
              >
                Upgrade to Lite
              </button>
              <div className="flex flex-col gap-3 mt-6">
                {[
                  "Access to Gyra Build",
                  "Create apps with a single prompt",
                  "2x longer conversations in Chat",
                  "Expert mode",
                  "Try out AI image & video creation",
                  "Increased limits at regular speed",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-zinc-400 w-6 text-center">✦</span>
                    <p className="text-sm text-zinc-300">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-zinc-500">
              <a href="#" className="hover:text-white">Terms</a> |{" "}
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </p>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 w-[85%] max-w-sm md:w-64 border-r border-zinc-800/50 flex flex-col justify-between bg-black transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                {user ? user.email[0].toUpperCase() : "?"}
              </div>
              <p className="text-sm font-semibold truncate">
                {user ? user.email.split("@")[0] : "Loading..."}
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-zinc-500 hover:text-white md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: "Automations", icon: "⚙️", action: () => alert("Automations coming soon!") },
              { label: "Library", icon: "📚", action: () => alert("Library coming soon!") },
              { label: "Projects", icon: "📁", action: () => alert("Projects coming soon!") },
              { label: "Gyra Bot", icon: "🤖", badge: "New", action: () => window.open("https://t.me/Gyra_AiBot", "_blank") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <span className="w-5 h-5 flex items-center justify-center text-zinc-400">
                  {item.icon}
                </span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowUpgrade(true);
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 mb-6 transition-colors text-left"
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">SuperGyra</p>
              <p className="text-xs text-blue-200">Early access to new features</p>
            </div>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              Upgrade
            </span>
          </button>

          <div className="mb-4">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1 mb-2">
              Conversations
            </p>
            <div className="flex flex-col gap-1">
              {filteredChats.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 italic">No chats yet.</p>
              ) : (
                filteredChats.map((chat) => (
                  <div key={chat.id} className="relative group">
                    <button
                      onClick={() => selectChat(chat.id)}
                      className={`w-full text-left px-2 py-2 rounded-lg transition-colors pr-8 ${
                        activeChatId === chat.id
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <p className="text-sm truncate">
                        {chat.pinned && "📌 "}
                        {chat.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {formatChatDate(chat.created_at)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id);
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 ${
                        activeChatMenu === chat.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {activeChatMenu === chat.id && (
                      <div className="absolute right-0 top-12 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[100] p-1 flex flex-col">
                        <button
                          onClick={() => {
                            window.open(`/dashboard?chat=${chat.id}`, "_blank");
                            setActiveChatMenu(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          Open new tab
                        </button>
                        <button
                          onClick={() => renameChat(chat.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => pinChat(chat.id, chat.pinned)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          {chat.pinned ? "Unpin" : "Pin"}
                        </button>
                        <div className="h-px bg-zinc-700 my-1"></div>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded-md text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm text-zinc-300 placeholder:text-zinc-500 flex-1 min-w-0"
              />
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={createNewChat}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center md:hidden"
            >
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:block ml-2">
              <h1 className="text-lg font-bold">Gyra</h1>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/api")}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
            title="Developer API"
          >
            <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full border border-zinc-800 flex items-center justify-center mb-6 opacity-40">
                  <span className="text-6xl font-bold tracking-tighter text-white">
                    G
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">
                  Ask anything to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 self-end text-white"
                      : "bg-zinc-800 self-start text-zinc-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MessageContent content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {loading &&
                    i === messages.length - 1 &&
                    msg.role === "assistant" &&
                    !msg.content && (
                      <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse"></span>
                    )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="w-full max-w-3xl mx-auto px-4 pb-4 shrink-0">
          {messages.length === 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                ⚡ Try SuperGyra
              </button>
              <button
                onClick={() => alert("Build apps coming soon!")}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-zinc-800"
              >
                🛠 Build apps and sites
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setThinkMode(!thinkMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                thinkMode
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
              }`}
            >
              🧠 Think
            </button>
            <button
              onClick={() => setSearchMode(!searchMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                searchMode
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
              }`}
            >
              🌐 Search
            </button>
          </div>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-3 flex flex-col gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything"
              className="bg-transparent outline-none text-base text-white placeholder:text-zinc-500 w-full px-2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                  ⚡ Fast
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                  🎙
                </button>
                {input.trim().length > 0 ? (
                  <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-colors">
                    🎙 Speak
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
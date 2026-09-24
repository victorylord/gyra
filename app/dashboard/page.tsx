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
                {copiedIndex === i ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
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
  const [showToS, setShowToS] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsSubPage, setSettingsSubPage] = useState<string | null>(null);

  // Report form
  const [reportName, setReportName] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Chat state
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  // Think + Search toggles
  const [thinkMode, setThinkMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Broadcast
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  // Attachment state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    type: "image" | "file";
    name: string;
    base64: string;
    preview?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings toggles
  const [setTimeZone, setSetTimeZone] = useState(true);
  const [kidsMode, setKidsMode] = useState(false);
  const [nsfwMode, setNsfwMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState("Ara");
  const [theme, setTheme] = useState("System");
  const [haptics, setHaptics] = useState(true);
  const [responseStyle, setResponseStyle] = useState("Balanced");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        setReportEmail(user.email || "");
        setReportName(user.email?.split("@")[0] || "");

        const { data: pref } = await supabase
          .from("user_prefs")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!pref) {
          await supabase
            .from("user_prefs")
            .insert([{ user_id: user.id, tos_seen: false }]);
          setShowToS(true);
        } else if (!pref.tos_seen) {
          setShowToS(true);
        }

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

      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        const geo = await geoRes.json();
        const ipHash = btoa(geo.ip || "unknown").substring(0, 16);
        await supabase.from("visitors").insert([
          {
            ip_hash: ipHash,
            country: geo.country_name || "Unknown",
            city: geo.city || "Unknown",
            user_agent: navigator.userAgent,
            path: window.location.pathname,
            user_id: user?.id || null,
          },
        ]);
      } catch (e) {}
    };
    init();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, attachment]);

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(
        data.map((m: any) => ({
          role: m.role,
          content: m.content,
          attachment_url: m.attachment_url,
          attachment_type: m.attachment_type,
          attachment_name: m.attachment_name,
        }))
      );
    }
  };

  const markTosSeen = async () => {
    if (!user) return;
    await supabase
      .from("user_prefs")
      .update({ tos_seen: true })
      .eq("user_id", user.id);
    setShowToS(false);
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

  // ---------- ATTACHMENT HANDLING ----------
  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    const maxSize = type === "image" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `File is too large. Max: ${type === "image" ? "10 MB" : "5 MB"}`
      );
      return;
    }

    setUploading(true);
    setShowAttachMenu(false);

    try {
      // Read as base64 for preview + AI
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() || "bin";
      const filename = `${user?.id || "anon"}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
        });

      let publicUrl = "";
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(filename);
        publicUrl = urlData.publicUrl;
      }

      setAttachment({
        url: publicUrl,
        type,
        name: file.name,
        base64,
        preview: type === "image" ? base64 : undefined,
      });
    } catch (err) {
      alert("Failed to attach file. Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = () => setAttachment(null);

  // ---------- SEND MESSAGE ----------
  const sendMessage = async () => {
    if (!input.trim() && !attachment) return;
    if (uploading) return;

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

    const userMessage: any = {
      role: "user",
      content: input || (attachment ? `[Attached ${attachment.type}]` : ""),
      attachment_url: attachment?.url,
      attachment_type: attachment?.type,
      attachment_name: attachment?.name,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);
    setLoading(true);

    // Save user message
    await supabase.from("messages").insert([
      {
        chat_id: chatId,
        role: "user",
        content: currentInput || `[Attached ${currentAttachment?.type}]`,
        attachment_url: currentAttachment?.url || null,
        attachment_type: currentAttachment?.type || null,
        attachment_name: currentAttachment?.name || null,
      },
    ]);

    // Update title
    if (messages.length === 0) {
      const base =
        currentInput || (currentAttachment ? `📎 ${currentAttachment.name}` : "");
      const newTitle = base.substring(0, 25) + (base.length > 25 ? "..." : "");
      await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
      setChats(
        chats.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
      );
    }

    // Add empty assistant message
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);

    try {
      // Build messages for API with base64 payload if attachment exists
      const apiMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

      const lastApiMessage: any = {
        role: "user",
        content: currentInput || "Please analyze this.",
      };

      if (currentAttachment) {
        if (currentAttachment.type === "image") {
          lastApiMessage.imageBase64 = currentAttachment.base64;
        } else {
          lastApiMessage.fileBase64 = currentAttachment.base64;
        }
      }

      apiMessages.push(lastApiMessage);

      const res = await fetch("https://gyra.ng/api/chat", {
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
                next[next.length - 1] = {
                  role: "assistant",
                  content: fullReply,
                };
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

  // ... [rest of the functions: deleteChat, renameChat, pinChat, handleLogout, formatChatDate, submitReport, clearAllChats, filteredChats, settingsRow, settingsToggle, renderSettingsSubPage — same as before]

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

  const submitReport = async () => {
    if (
      !reportName.trim() ||
      !reportEmail.trim() ||
      !reportTitle.trim() ||
      !reportDescription.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }
    setReportSubmitting(true);
    const { error } = await supabase.from("reports").insert([
      {
        user_id: user?.id || null,
        name: reportName,
        email: reportEmail,
        title: reportTitle,
        description: reportDescription,
      },
    ]);
    setReportSubmitting(false);
    if (error) {
      alert("Failed to submit report. Please try again.");
    } else {
      setReportSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setSettingsSubPage(null);
        setReportTitle("");
        setReportDescription("");
      }, 2500);
    }
  };

  const clearAllChats = async () => {
    if (!user) return;
    if (!confirm("Delete all your conversations? This cannot be undone.")) return;
    await supabase.from("chats").delete().eq("user_id", user.id);
    setChats([]);
    setActiveChatId(null);
    setMessages([]);
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const settingsRow = (
    label: string,
    icon: string,
    sub?: string,
    onClick?: () => void
  ) => (
    <button
      key={label}
      onClick={onClick || (() => setSettingsSubPage(label))}
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
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl">
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

  const renderSettingsSubPage = () => {
    switch (settingsSubPage) {
      case "Report a Problem":
        return reportSubmitted ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="font-semibold mb-2">Report submitted!</p>
            <p className="text-sm text-zinc-500">
              Thank you for helping us improve Gyra.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Write your problem here
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what went wrong in detail..."
                rows={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <button
              onClick={submitReport}
              disabled={reportSubmitting}
              className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {reportSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        );

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
                {theme === t && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        );

      case "Haptics":
        return (
          <div className="flex flex-col gap-3">
            {settingsToggle(
              "Enable Haptics",
              "📳",
              "Vibrate on button taps and messages.",
              haptics,
              setHaptics
            )}
          </div>
        );

      case "Widget":
        return (
          <div className="text-zinc-300">
            <p className="text-sm mb-3">Home screen widgets are coming soon.</p>
          </div>
        );

      case "Advanced":
        return (
          <div className="flex flex-col gap-3">
            {settingsToggle("Experimental Features", "⚡", "Enable beta features.", false, () => {})}
            {settingsToggle("Developer Mode", "🛠️", "Show debug info in chat.", false, () => {})}
          </div>
        );

      case "Customize Gyra":
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400">
              Choose how Gyra responds to you.
            </p>
            {["Balanced", "Concise", "Detailed", "Creative"].map((style) => (
              <button
                key={style}
                onClick={() => setResponseStyle(style)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  responseStyle === style
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium">{style}</span>
                {responseStyle === style && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        );

      case "Connectors":
      case "Skills":
      case "Voice":
      case "Time zone":
      case "Shared Conversations":
        return (
          <div className="text-zinc-300 text-sm">
            <p>This section is available in the full release.</p>
          </div>
        );

      case "Data Controls":
        return (
          <div className="flex flex-col gap-4">
            <button
              onClick={clearAllChats}
              className="w-full bg-red-600/20 border border-red-600/50 text-red-400 py-3 rounded-xl font-medium text-sm hover:bg-red-600/30 transition-colors"
            >
              Clear All Conversations
            </button>
          </div>
        );

      case "Open Source Licenses":
        return (
          <div className="text-zinc-300 text-sm flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {[
                { name: "Next.js", license: "MIT" },
                { name: "React", license: "MIT" },
                { name: "Tailwind CSS", license: "MIT" },
                { name: "Supabase", license: "Apache 2.0" },
              ].map((lib) => (
                <div key={lib.name} className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded-lg">
                  <span className="text-sm">{lib.name}</span>
                  <span className="text-xs text-zinc-500 font-mono">{lib.license}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "Terms of Use":
        return (
          <div className="text-zinc-300 text-sm leading-relaxed flex flex-col gap-4">
            <p>By using Gyra, you agree to use our AI responsibly. You must not use Gyra for illegal activities, to generate harmful content, or to infringe on others' rights.</p>
            <p>Last updated: September 2026</p>
          </div>
        );

      case "Privacy Policy":
        return (
          <div className="text-zinc-300 text-sm leading-relaxed flex flex-col gap-4">
            <p>We collect only what we need to run Gyra. Your conversations are stored securely in Supabase and never shared with third parties.</p>
            <p>Last updated: September 2026</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      {/* HIDDEN FILE INPUTS */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelected(e, "image")}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileSelected(e, "image")}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.pptx"
        className="hidden"
        onChange={(e) => handleFileSelected(e, "file")}
      />

      {/* BROADCAST BANNER */}
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
            <button onClick={() => setActiveBroadcast(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* TOS MODAL */}
      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Updates to our Terms of Service</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We're updating our Terms of Service and Acceptable Use Policy.
            </p>
            <button onClick={markTosSeen} className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 bg-black z-[70] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50">
            {settingsSubPage ? (
              <button onClick={() => setSettingsSubPage(null)} className="text-zinc-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
            ) : (
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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
                    <p className="font-semibold truncate">{user ? user.email.split("@")[0] : "Loading..."}</p>
                    <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button onClick={() => { setShowSettings(false); setShowUpgrade(true); }} className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 mb-6">
                  <Image src="/logo.jpeg" alt="Gyra" width={32} height={32} className="rounded-full" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">SuperGyra</p>
                    <p className="text-xs text-zinc-500">Premium Ask, Voice, Imagine...</p>
                  </div>
                  <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">Upgrade</span>
                </button>
                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">App</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Appearance", "🌗", theme)}
                  {settingsRow("Haptics", "📳", haptics ? "On" : "Off")}
                  {settingsRow("Widget", "🧩")}
                  {settingsRow("Advanced", "⚙️")}
                </div>
                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Gyra</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Customize Gyra", "🎨", responseStyle)}
                  {settingsRow("Connectors", "🔗")}
                  {settingsRow("Skills", "🧠")}
                </div>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsToggle("Kids Mode", "⭐", "Filter responses for younger users.", kidsMode, setKidsMode)}
                  {settingsToggle("NSFW Preferences", "🔞", "Allow mature content.", nsfwMode, setNsfwMode)}
                </div>
                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Voice</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Voice", "🎤", voiceMode)}
                </div>
                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Bot</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsToggle("Set time zone automatically", "🕒", "Your Bot follows this device.", setTimeZone, setSetTimeZone)}
                  {settingsRow("Time zone", "🌍", "Africa/Lagos")}
                </div>
                <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Data & Information</p>
                <div className="flex flex-col gap-1 mb-6">
                  {settingsRow("Shared Conversations", "🔗")}
                  {settingsRow("Data Controls", "🗄️")}
                  {settingsRow("Open Source Licenses", "📄")}
                  {settingsRow("Terms of Use", "📋")}
                  {settingsRow("Privacy Policy", "🔒")}
                  {settingsRow("Report a Problem", "🚩")}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-red-500">
                  <span className="w-6 h-6 flex items-center justify-center">🚪</span>
                  <p className="text-sm font-medium">Sign out</p>
                </button>
                <p className="text-center text-xs text-zinc-600 mt-6 mb-4">1.0.0-release.00</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div className="absolute inset-0 bg-black z-[75] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <button onClick={() => setShowUpgrade(false)} className="text-zinc-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h2 className="text-2xl font-bold text-center mb-2">Keep chatting with basic access</h2>
            <p className="text-zinc-400 text-center text-sm mb-6">Choose the right plan for you</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">SuperGyra <span className="text-zinc-500 font-normal">Lite</span></h3>
              <button onClick={() => alert("Payments coming soon!")} className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors">Upgrade to Lite — ₦10,000/month</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 z-40 md:hidden" />
      )}

      {/* SIDEBAR */}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 w-[85%] max-w-sm md:w-64 border-r border-zinc-800/50 flex flex-col justify-between bg-black transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                {user ? user.email[0].toUpperCase() : "?"}
              </div>
              <p className="text-sm font-semibold truncate">{user ? user.email.split("@")[0] : "Loading..."}</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: "Automations", icon: "⚙️", action: () => alert("Automations coming soon!") },
              { label: "Library", icon: "📚", action: () => alert("Library coming soon!") },
              { label: "Projects", icon: "📁", action: () => alert("Projects coming soon!") },
              { label: "Gyra Bot", icon: "🤖", badge: "New", action: () => window.open("https://t.me/Gyra_AiBot", "_blank") },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left">
                <span className="w-5 h-5 flex items-center justify-center text-zinc-400">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowUpgrade(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 mb-6 transition-colors text-left">
            <div className="flex-1">
              <p className="font-semibold text-sm">SuperGyra</p>
              <p className="text-xs text-blue-200">Early access to new features</p>
            </div>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">Upgrade</span>
          </button>
          <div className="mb-4">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1 mb-2">Conversations</p>
            <div className="flex flex-col gap-1">
              {filteredChats.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 italic">No chats yet.</p>
              ) : (
                filteredChats.map((chat) => (
                  <div key={chat.id} className="relative group">
                    <button onClick={() => selectChat(chat.id)} className={`w-full text-left px-2 py-2 rounded-lg transition-colors pr-8 ${activeChatId === chat.id ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-900"}`}>
                      <p className="text-sm truncate">{chat.pinned && "📌 "}{chat.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{formatChatDate(chat.created_at)}</p>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id); }} className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 ${activeChatMenu === chat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                    {activeChatMenu === chat.id && (
                      <div className="absolute right-0 top-12 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[100] p-1 flex flex-col">
                        <button onClick={() => { window.open(`/dashboard?chat=${chat.id}`, "_blank"); setActiveChatMenu(null); }} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">Open new tab</button>
                        <button onClick={() => renameChat(chat.id)} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">Rename</button>
                        <button onClick={() => pinChat(chat.id, chat.pinned)} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">{chat.pinned ? "Unpin" : "Pin"}</button>
                        <div className="h-px bg-zinc-700 my-1"></div>
                        <button onClick={() => deleteChat(chat.id)} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded-md text-left">Delete</button>
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
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-sm text-zinc-300 placeholder:text-zinc-500 flex-1 min-w-0" />
            </div>
            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={createNewChat} className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center md:hidden">
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-4 md:hidden ml-2">
              <button className="text-white font-semibold text-base border-b-2 border-white pb-1">Ask</button>
              <button className="text-zinc-500 font-medium text-base">Imagine</button>
              <button className="text-zinc-500 font-medium text-base">Build</button>
            </div>
            <div className="hidden md:block ml-2"><h1 className="text-lg font-bold">Gyra</h1></div>
          </div>
          <button onClick={() => (window.location.href = "/api")} className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center" title="Developer API">
            <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </button>
        </div>

        {/* MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden opacity-20 flex items-center justify-center">
                <Image src="/logo.jpeg" alt="Gyra Logo" width={256} height={256} className="object-contain" />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`p-4 rounded-xl max-w-[85%] leading-relaxed ${msg.role === "user" ? "bg-blue-600 self-end text-white" : "bg-zinc-800 self-start text-zinc-200"}`}>
                  {msg.attachment_url && msg.attachment_type === "image" && (
                    <img src={msg.attachment_url} alt="attachment" className="rounded-lg mb-2 max-w-full max-h-64" />
                  )}
                  {msg.attachment_url && msg.attachment_type === "file" && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 mb-2 text-xs">
                      📎 {msg.attachment_name || "Attached file"}
                    </a>
                  )}
                  {msg.role === "assistant" ? (
                    <>
                      {loading && i === messages.length - 1 && !msg.content && attachment === null && (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                          {messages[messages.length - 1]?.attachment_url ? "Reading and analyzing..." : "Thinking..."}
                        </div>
                      )}
                      <MessageContent content={msg.content} />
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {loading && i === messages.length - 1 && msg.role === "assistant" && !msg.content && (
                    <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse"></span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 shrink-0">
          {/* THINK + SEARCH BUTTONS */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setThinkMode(!thinkMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${thinkMode ? "bg-blue-600 border-blue-500 text-white" : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" /></svg>
              Think
            </button>
            <button onClick={() => setSearchMode(!searchMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${searchMode ? "bg-blue-600 border-blue-500 text-white" : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
              Search
            </button>
          </div>

          {/* ATTACHMENT PREVIEW */}
          {attachment && (
            <div className="mb-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3">
              {attachment.type === "image" && attachment.preview ? (
                <img src={attachment.preview} alt="preview" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">📎</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-zinc-500">{attachment.type === "image" ? "Image attached" : "File attached"}</p>
              </div>
              <button onClick={removeAttachment} className="text-zinc-500 hover:text-red-400 text-xl">✕</button>
            </div>
          )}

          {/* ATTACH MENU */}
          {showAttachMenu && (
            <div className="mb-3 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-1">
              <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl text-sm text-left transition-colors">
                <span className="text-xl">📷</span>
                <span>Camera</span>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl text-sm text-left transition-colors">
                <span className="text-xl">🖼️</span>
                <span>Gallery</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl text-sm text-left transition-colors">
                <span className="text-xl">📎</span>
                <span>Files</span>
              </button>
            </div>
          )}

          {/* INPUT BOX */}
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-3 flex flex-col gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={attachment ? "Describe what you want Gyra to do with this..." : "Ask anything"}
              className="bg-transparent outline-none text-base text-white placeholder:text-zinc-500 w-full px-2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showAttachMenu ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                >
                  {showAttachMenu ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  )}
                </button>
                <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Fast
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7" /></svg>
                </button>
                {input.trim().length > 0 || attachment ? (
                  <button onClick={sendMessage} disabled={loading || uploading} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    )}
                  </button>
                ) : (
                  <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7" /></svg>
                    Speak
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
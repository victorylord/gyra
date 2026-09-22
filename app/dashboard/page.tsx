"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Image from "next/image";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showToS, setShowToS] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("General");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [country, setCountry] = useState<string>("Nigeria");

  // Chat state
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  // Settings toggles
  const [setTimeZone, setSetTimeZone] = useState(true);

  // Detect user country for currency
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_name) setCountry(data.country_name);
      } catch (e) {
        // Fallback to Nigeria
      }
    };
    detectCountry();
  }, []);

  // Fetch user + chats
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });
        if (data) {
          setChats(data);
          if (data.length > 0) setActiveChatId(data[0].id);
        }
      }
    };
    init();
  }, []);

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

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId) return;
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    if (messages.length === 0) {
      const newTitle =
        currentInput.substring(0, 25) +
        (currentInput.length > 25 ? "..." : "");
      await supabase
        .from("chats")
        .update({ title: newTitle })
        .eq("id", activeChatId);
      setChats(
        chats.map((c) =>
          c.id === activeChatId ? { ...c, title: newTitle } : c
        )
      );
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: data.message },
        ]);
      }
    } catch (err) {
      console.error(err);
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
      setChats(
        chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
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
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    setChats(updatedChats);
    setActiveChatMenu(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const selectChat = (id: string) => {
    setActiveChatId(id);
    setMessages([]);
    setIsSidebarOpen(false);
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

  // Currency logic
  const getPricing = () => {
    const baseNaira = 10000;
    const prices: { [key: string]: { symbol: string; price: number } } = {
      Nigeria: { symbol: "₦", price: baseNaira },
      "United States": { symbol: "$", price: 10 },
      "United Kingdom": { symbol: "£", price: 8 },
      Canada: { symbol: "C$", price: 14 },
      Germany: { symbol: "€", price: 9 },
      France: { symbol: "€", price: 9 },
      India: { symbol: "₹", price: 800 },
      "South Africa": { symbol: "R", price: 180 },
      Ghana: { symbol: "GH₵", price: 150 },
      Kenya: { symbol: "KSh", price: 1300 },
    };
    return prices[country] || { symbol: "$", price: 10 };
  };

  const pricing = getPricing();

  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      {/* TOS MODAL */}
      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">
              Updates to our Terms of Service
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We're updating our Terms of Service and Acceptable Use Policy.
              Now's a great chance to review them.
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

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 bg-black z-[70] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50">
            <button
              onClick={() => setShowSettings(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
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
            <h2 className="text-xl font-bold">Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* User Profile Card */}
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

            {/* SuperGyra Banner */}
            <button
              onClick={() => {
                setShowSettings(false);
                setShowUpgrade(true);
              }}
              className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 mb-6 transition-colors"
            >
              <Image
                src="/logo.jpeg"
                alt="Gyra"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">SuperGyra</p>
                <p className="text-xs text-zinc-500">
                  Premium Ask, Voice, Imagine...
                </p>
              </div>
              <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                Upgrade
              </span>
            </button>

            {/* App Section */}
            <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">App</p>
            <div className="flex flex-col gap-1 mb-6">
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Appearance</p>
                  <p className="text-xs text-zinc-500">System</p>
                </div>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium">Haptics</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <p className="text-sm font-medium">Widget</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <p className="text-sm font-medium">Advanced</p>
              </button>
            </div>

            {/* Gyra Section */}
            <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Gyra</p>
            <div className="flex flex-col gap-1 mb-6">
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <p className="text-sm font-medium">Customize Gyra</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <p className="text-sm font-medium">Connectors</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                <p className="text-sm font-medium">Skills</p>
              </button>
            </div>

            {/* Kids Mode + NSFW */}
            <div className="flex flex-col gap-1 mb-6">
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <p className="text-sm font-medium">Kids Mode</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                  18
                </div>
                <p className="text-sm font-medium">NSFW Preferences</p>
              </button>
            </div>

            {/* Voice */}
            <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">
              Voice
            </p>
            <div className="flex flex-col gap-1 mb-6">
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7"
                  />
                </svg>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Voice</p>
                  <p className="text-xs text-zinc-500">Ara</p>
                </div>
              </button>
            </div>

            {/* Bot */}
            <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">Bot</p>
            <div className="flex flex-col gap-1 mb-6">
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">
                      Set time zone automatically
                    </p>
                    <p className="text-xs text-zinc-500">
                      Your Bot's computer follows this device's time zone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSetTimeZone(!setTimeZone)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    setTimeZone ? "bg-white" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      setTimeZone ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Time zone</p>
                  <p className="text-xs text-zinc-500">Africa/Lagos</p>
                </div>
              </button>
            </div>

            {/* Data & Information */}
            <p className="text-sm text-zinc-500 font-semibold mb-2 px-2">
              Data & Information
            </p>
            <div className="flex flex-col gap-1 mb-6">
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <p className="text-sm font-medium">Shared Conversations</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                <p className="text-sm font-medium">Data Controls</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium">Open Source Licenses</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium">Terms of Use</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-sm font-medium">Privacy Policy</p>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium">Report a Problem</p>
              </button>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-red-500"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <p className="text-sm font-medium">Sign out</p>
            </button>

            {/* Version */}
            <p className="text-center text-xs text-zinc-600 mt-6 mb-4">
              1.0.0-release.00
            </p>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div className="absolute inset-0 bg-black z-[75] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => setShowUpgrade(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h2 className="text-2xl font-bold text-center mb-2">
              Keep chatting with basic access
            </h2>
            <p className="text-zinc-400 text-center text-sm mb-6">
              Choose the right plan for you
            </p>

            {/* Tiers */}
            <div className="flex items-center gap-2 bg-zinc-900 rounded-full p-1 mb-6 overflow-x-auto">
              {["Lite", "SuperGyra", "Plus", "Heavy"].map((tier, i) => (
                <button
                  key={tier}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    i === 0
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Pricing Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">
                SuperGyra{" "}
                <span className="text-zinc-500 font-normal">Lite</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="border-2 border-blue-500 bg-blue-500/10 rounded-xl p-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
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
                    </div>
                  </div>
                  <p className="text-lg font-bold">
                    {pricing.symbol}
                    {pricing.price.toLocaleString()}.00
                  </p>
                  <p className="text-xs text-zinc-500">Billed monthly</p>
                </button>

                <button className="border border-zinc-800 rounded-xl p-4 text-left relative">
                  <span className="absolute top-2 right-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    Save 17%
                  </span>
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-700 mb-2"></div>
                  <p className="text-lg font-bold">
                    {pricing.symbol}
                    {(pricing.price * 11.88).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                    .00
                  </p>
                  <p className="text-xs text-zinc-500">Billed yearly</p>
                </button>
              </div>

              <button className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors">
                Upgrade to Lite
              </button>

              <div className="flex flex-col gap-3 mt-6">
                {[
                  {
                    icon: "</>",
                    text: "Access to Gyra Build",
                  },
                  {
                    icon: "🪶",
                    text: "Create apps with a single prompt",
                  },
                  {
                    icon: "🚀",
                    text: "2x longer conversations in Chat",
                  },
                  {
                    icon: "🧠",
                    text: "Expert mode",
                  },
                  {
                    icon: "🖼️",
                    text: "Try out AI image & video creation",
                  },
                  {
                    icon: "⚡",
                    text: "Increased limits at regular speed",
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-zinc-400 w-6 text-center">
                      {feature.icon}
                    </span>
                    <p className="text-sm text-zinc-300">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-zinc-500">
              <a href="#" className="hover:text-white">
                Terms
              </a>{" "}
              |{" "}
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-[85%] max-w-sm md:w-64 border-r border-zinc-800/50 flex flex-col justify-between bg-black
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Profile */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                {user ? user.email[0].toUpperCase() : "?"}
              </div>
              <div>
                <p className="text-sm font-semibold truncate">
                  {user ? user.email.split("@")[0] : "Loading..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-zinc-500 hover:text-white md:hidden"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* MENU CARDS */}
          <div className="flex flex-col gap-2 mb-4">
            {[
              {
                label: "Automations",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Library",
                icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
              },
              {
                label: "Projects",
                icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => alert(`${item.label} coming soon!`)}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  />
                </svg>
                {item.label}
              </button>
            ))}
            <button
              onClick={() => alert("Gyra Bot coming soon!")}
              className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Gyra Bot
              <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                New
              </span>
            </button>
          </div>

          {/* UPGRADE BANNER */}
          <button
            onClick={() => {
              setShowUpgrade(true);
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 mb-6 transition-colors text-left"
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">SuperGyra</p>
              <p className="text-xs text-blue-200">
                Early access to new features
              </p>
            </div>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              Upgrade
            </span>
          </button>

          {/* CONVERSATIONS */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                Conversations
              </p>
              <svg
                className="w-3 h-3 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              {chats.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 italic">No chats yet.</p>
              ) : (
                chats.map((chat) => (
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
                        setActiveChatMenu(
                          activeChatMenu === chat.id ? null : chat.id
                        );
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 ${
                        activeChatMenu === chat.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {activeChatMenu === chat.id && (
                      <div className="absolute right-0 top-12 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[100] p-1 flex flex-col">
                        <button
                          onClick={() => {
                            window.open(
                              `/dashboard?chat=${chat.id}`,
                              "_blank"
                            );
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

        {/* BOTTOM: Search + Icons */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent outline-none text-sm text-zinc-300 placeholder:text-zinc-500 flex-1 min-w-0"
              />
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={createNewChat}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        {/* TOP BAR */}
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center md:hidden"
            >
              <svg
                className="w-5 h-5 text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-4 md:hidden ml-2">
              <button className="text-white font-semibold text-base border-b-2 border-white pb-1">
                Ask
              </button>
              <button className="text-zinc-500 font-medium text-base">
                Imagine
              </button>
              <button className="text-zinc-500 font-medium text-base">
                Build
              </button>
            </div>
            <div className="hidden md:block ml-2">
              <h1 className="text-lg font-bold">Gyra</h1>
            </div>
          </div>
          <button
            onClick={() =>
              window.open("https://api.gyra.ng", "_blank")
            }
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
            title="Developer API"
          >
            <svg
              className="w-5 h-5 text-zinc-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </button>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col items-center justify-end w-full max-w-3xl mx-auto relative z-10 overflow-y-auto mb-4 px-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden opacity-20 flex items-center justify-center">
                <Image
                  src="/logo.jpeg"
                  alt="Gyra Logo"
                  width={256}
                  height={256}
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4 mt-auto pb-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 self-end text-white"
                      : "bg-zinc-800 self-start text-zinc-200"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="text-zinc-500 self-start italic animate-pulse">
                  Gyra is thinking...
                </div>
              )}
            </div>
          )}
        </div>

        {/* SUGGESTION BUTTONS + INPUT */}
        <div className="w-full max-w-3xl mx-auto px-4 mb-4">
          {messages.length === 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Try SuperGyra
              </button>
              <button
                onClick={() => alert("Build apps coming soon!")}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-zinc-800"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                Build apps and sites
              </button>
            </div>
          )}

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
                  <svg
                    className="w-4 h-4 text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Fast
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7"
                    />
                  </svg>
                </button>
                <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-colors">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7"
                    />
                  </svg>
                  Speak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
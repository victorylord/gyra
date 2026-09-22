"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showToS, setShowToS] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("Account");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat state
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  // Fetch user + chats
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
        currentInput.substring(0, 25) + (currentInput.length > 25 ? "..." : "");
      await supabase.from("chats").update({ title: newTitle }).eq("id", activeChatId);
      setChats(chats.map((c) => (c.id === activeChatId ? { ...c, title: newTitle } : c)));
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([...updatedMessages, { role: "assistant", content: data.message }]);
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

  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      {/* TOS MODAL */}
      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Updates to our Terms of Service</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We're updating our Terms of Service and Acceptable Use Policy. Now's a
              great chance to review them.
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
          {/* TOP: User Profile */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                {user ? user.email[0].toUpperCase() : "?"}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {user ? user.email.split("@")[0] : "Loading..."}
                </p>
              </div>
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

          {/* MENU CARDS */}
          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: "Automations", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Library", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
              { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => alert(`${item.label} coming soon!`)}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
            {/* Gyra Bot with New badge */}
            <button
              onClick={() => alert("Gyra Bot coming soon!")}
              className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Gyra Bot
              <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                New
              </span>
            </button>
          </div>

          {/* UPGRADE BANNER */}
          <button
            onClick={() => alert("Upgrade modal coming soon!")}
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

          {/* CONVERSATIONS */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                Conversations
              </p>
              <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
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
                        setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id);
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 ${
                        activeChatMenu === chat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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

        {/* BOTTOM: Search + Icons */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        {/* TOP BAR */}
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center md:hidden"
            >
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Mobile tabs */}
            <div className="flex items-center gap-4 md:hidden ml-2">
              <button className="text-white font-semibold text-base border-b-2 border-white pb-1">Ask</button>
              <button className="text-zinc-500 font-medium text-base">Imagine</button>
              <button className="text-zinc-500 font-medium text-base">Build</button>
            </div>
            {/* Desktop title */}
            <div className="hidden md:block ml-2">
              <h1 className="text-lg font-bold">Gyra</h1>
            </div>
          </div>
          <button
            onClick={() => alert("Developer API coming soon!")}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col items-center justify-end w-full max-w-3xl mx-auto relative z-10 overflow-y-auto mb-4 px-4">
          {messages.length === 0 ? (
            <>
              {/* Dim Gyra logo in center */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-40 h-40 md:w-64 md:h-64 rounded-full bg-zinc-900 flex items-center justify-center opacity-20">
                  <span className="text-6xl md:text-8xl font-bold text-zinc-700">G</span>
                </div>
              </div>
            </>
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
                onClick={() => alert("Upgrade modal coming soon!")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try SuperGyra
              </button>
              <button
                onClick={() => alert("Build apps coming soon!")}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-zinc-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
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
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-300 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Fast
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7" />
                  </svg>
                </button>
                <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 01-7-7" />
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
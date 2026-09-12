"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showToS, setShowToS] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("Account");
  
  // Chat State
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Menu State
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  // Fetch user and chats on load
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false });
        
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
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Conversation' }])
      .select()
      .single();

    if (data) {
      setChats([data, ...chats]);
      setActiveChatId(data.id);
      setMessages([]);
    }
  };

  // Send Message with Dynamic Title Logic
  const sendMessage = async () => {
    if (!input.trim() || !activeChatId) return;
    
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    // Dynamic Title Update
    if (messages.length === 0) {
      const newTitle = currentInput.substring(0, 25) + (currentInput.length > 25 ? '...' : '');
      await supabase.from('chats').update({ title: newTitle }).eq('id', activeChatId);
      setChats(chats.map(c => c.id === activeChatId ? { ...c, title: newTitle } : c));
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
      } else if (data.error) {
        setMessages([...updatedMessages, { role: "assistant", content: "I encountered an error. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Chat Actions (Delete, Rename, Pin)
  const deleteChat = async (id: string) => {
    await supabase.from('chats').delete().eq('id', id);
    setChats(chats.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(chats.length > 1 ? chats.find(c => c.id !== id)?.id || null : null);
      setMessages([]);
    }
    setActiveChatMenu(null);
  };

  const renameChat = async (id: string) => {
    const newTitle = window.prompt("Rename conversation:");
    if (newTitle && newTitle.trim()) {
      await supabase.from('chats').update({ title: newTitle }).eq('id', id);
      setChats(chats.map(c => c.id === id ? { ...c, title: newTitle } : c));
    }
    setActiveChatMenu(null);
  };

  const pinChat = async (id: string, currentPinStatus: boolean) => {
    const newPinStatus = !currentPinStatus;
    await supabase.from('chats').update({ pinned: newPinStatus }).eq('id', id);
    
    // Re-sort the chats: Pinned first, then newest
    const updatedChats = chats.map(c => c.id === id ? { ...c, pinned: newPinStatus } : c);
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

  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      
      {/* --- TOS MODAL --- */}
      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Updates to our Terms of Service</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We're updating our Terms of Service and Acceptable Use Policy. Now's a great chance to review them.
            </p>
            <button onClick={() => setShowToS(false)} className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
            <div className="w-56 border-r border-zinc-800 p-4 flex flex-col gap-1">
              <h2 className="text-lg font-bold mb-4 px-2">Settings</h2>
              {["Account", "Appearance", "Behavior", "Notifications", "Data Controls"].map((tab) => (
                <button key={tab} onClick={() => setActiveSettingsTab(tab)} className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${activeSettingsTab === tab ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
                  {tab}
                </button>
              ))}
              <div className="mt-auto">
                <button onClick={() => setShowSettings(false)} className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">Close Settings</button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6">{activeSettingsTab}</h3>
              {activeSettingsTab === "Account" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div>
                      <p className="font-medium">{user?.email.split('@')[0]}</p>
                      <p className="text-sm text-zinc-500">{user?.email}</p>
                    </div>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">Manage</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div>
                      <p className="font-medium">SuperGyra</p>
                      <p className="text-sm text-zinc-500">Unlock extended capabilities</p>
                    </div>
                    <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">Upgrade</button>
                  </div>
                </div>
              )}
              {/* Add other settings tabs here if needed */}
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div className="w-64 border-r border-zinc-800/50 flex flex-col justify-between p-4 relative z-20 bg-black">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">G</div>
              <h1 className="text-2xl font-bold tracking-tighter">Gyra</h1>
            </div>
            <button onClick={createNewChat} className="text-zinc-500 hover:text-white transition-colors" title="New Chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>

          <div className="flex flex-col gap-1 mb-8">
            <button className="flex items-center gap-3 px-3 py-2 bg-zinc-900 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Chat
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-zinc-900/50 hover:text-white rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Imagine
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-zinc-900/50 hover:text-white rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Library
            </button>
          </div>

          {/* CHAT HISTORY */}
          <div className="mb-4">
            <p className="text-xs text-zinc-600 font-semibold px-2 mb-2 uppercase tracking-wider">Conversations</p>
            <div className="flex flex-col gap-1">
              {chats.map((chat) => (
                <div key={chat.id} className="relative group">
                  <button 
                    onClick={() => { setActiveChatId(chat.id); setMessages([]); }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors truncate pr-8 ${activeChatId === chat.id ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                  >
                    {chat.pinned && <span className="text-blue-500 mr-1">📌</span>}
                    {chat.title}
                  </button>
                  
                  {/* THREE DOTS BUTTON */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id); }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-opacity ${activeChatMenu === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>

                  {/* DROPDOWN MENU */}
                  {activeChatMenu === chat.id && (
                    <div className="absolute right-0 top-8 w-36 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[100] p-1 flex flex-col">
                      <button onClick={() => { window.open(`/dashboard?chat=${chat.id}`, '_blank'); setActiveChatMenu(null); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Open new tab
                      </button>
                      <button onClick={() => renameChat(chat.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Rename
                      </button>
                      <button onClick={() => pinChat(chat.id, chat.pinned)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <div className="h-px bg-zinc-700 my-1"></div>
                      <button onClick={() => deleteChat(chat.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded-md text-left">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="relative mt-4">
          {showProfileMenu && (
            <div className="absolute bottom-14 left-0 w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 mb-2 shadow-2xl z-50">
              <button onClick={() => { setShowSettings(true); setShowProfileMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">Settings</button>
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">Help</button>
              <div className="h-px bg-zinc-800 my-1"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg transition-colors">Sign Out</button>
            </div>
          )}
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 w-full p-2 hover:bg-zinc-900 rounded-xl transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user ? user.email[0].toUpperCase() : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user ? user.email.split('@')[0] : "Loading..."}</p>
              <p className="text-xs text-zinc-500 truncate">{user ? user.email : ""}</p>
            </div>
          </button>
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-end w-full max-w-3xl relative z-10 overflow-y-auto mb-6">
          {messages.length === 0 ? (
            <h2 className="text-4xl md:text-5xl font-bold mb-10 text-center text-zinc-200 mt-auto">
              What should we explore?
            </h2>
          ) : (
            <div className="w-full flex flex-col gap-4 mt-auto pb-6">
              {messages.map((msg, i) => (
                <div key={i} className={`p-4 rounded-xl max-w-[80%] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 self-end text-white' : 'bg-zinc-800 self-start text-zinc-200'}`}>
                  {msg.content}
                </div>
              ))}
              {loading && <div className="text-zinc-500 self-start italic animate-pulse">Gyra is thinking...</div>}
            </div>
          )}
        </div>

        <div className="w-full max-w-3xl relative z-10 mb-6">
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">SuperGyra</h3>
              <p className="text-sm text-zinc-500">Unlock extended capabilities</p>
            </div>
            <button className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-zinc-200 transition-colors">Upgrade</button>
          </div>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Gyra anything..." 
              className="flex-1 bg-transparent outline-none text-lg placeholder:text-zinc-600"
            />
            <button onClick={sendMessage} disabled={loading} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
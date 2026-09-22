"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const ADMIN_EMAIL = "victorylordhimself@gmail.com";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  const [visitors, setVisitors] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Broadcast form
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcType, setBcType] = useState("info");
  const [bcPosting, setBcPosting] = useState(false);
  const [bcSuccess, setBcSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && user.email === ADMIN_EMAIL) {
        // Fetch data in parallel
        const [visitorsRes, reportsRes, chatsRes, broadcastsRes] = await Promise.all([
          supabase.from("visitors").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("reports").select("*").order("created_at", { ascending: false }),
          supabase.from("chats").select("*").order("created_at", { ascending: false }),
          supabase.from("broadcasts").select("*").order("created_at", { ascending: false }),
        ]);

        if (visitorsRes.data) setVisitors(visitorsRes.data);
        if (reportsRes.data) setReports(reportsRes.data);
        if (chatsRes.data) setChats(chatsRes.data);
        if (broadcastsRes.data) setBroadcasts(broadcastsRes.data);

        // Get unique users from chats
        const { data: authUsers } = await supabase
          .from("chats")
          .select("user_id");
        const uniqueIds = Array.from(new Set((authUsers || []).map((u: any) => u.user_id)));
        setUsers(uniqueIds.map((id) => ({ id })));
      }
      setLoading(false);
    };
    init();
  }, []);

  const trackVisitor = async () => {
    // (Already handled by dashboard, but kept for admin test)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">🚫 Access Denied</h1>
        <p className="text-zinc-500 mb-8">This area is reserved for Gyra administrators.</p>
        <a href="/dashboard" className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200">
          Back to Dashboard
        </a>
      </div>
    );
  }

  // Stats
  const totalVisitors = visitors.length;
  const uniqueVisitors = new Set(visitors.map((v) => v.ip_hash || v.id)).size;
  const registeredUsers = users.length;
  const openReports = reports.filter((r) => r.status === "open").length;
  const activeBroadcasts = broadcasts.filter((b) => b.active && new Date(b.expires_at) > new Date()).length;

  const createBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim()) return;
    setBcPosting(true);
    const { data } = await supabase.from("broadcasts").insert([
      { title: bcTitle, message: bcMessage, type: bcType, active: true },
    ]).select().single();
    setBcPosting(false);
    if (data) {
      setBroadcasts([data, ...broadcasts]);
      setBcTitle("");
      setBcMessage("");
      setBcSuccess(true);
      setTimeout(() => setBcSuccess(false), 2500);
    }
  };

  const deleteBroadcast = async (id: string) => {
    if (!confirm("Delete this broadcast?")) return;
    await supabase.from("broadcasts").delete().eq("id", id);
    setBroadcasts(broadcasts.filter((b) => b.id !== id));
  };

  const toggleBroadcast = async (id: string, currentActive: boolean) => {
    await supabase.from("broadcasts").update({ active: !currentActive }).eq("id", id);
    setBroadcasts(broadcasts.map((b) => (b.id === id ? { ...b, active: !currentActive } : b)));
  };

  const updateReportStatus = async (id: string, newStatus: string) => {
    await supabase.from("reports").update({ status: newStatus }).eq("id", id);
    setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status: newStatus });
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    await supabase.from("reports").delete().eq("id", id);
    setReports(reports.filter((r) => r.id !== id));
    setSelectedReport(null);
  };

  const filteredReports = reports.filter((r) =>
    (r.title + r.email + r.description).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter((c) =>
    (c.title + c.user_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = ["Overview", "Broadcast", "Reports", "Chats", "Visitors"];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* TOP BAR */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
            G
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg block leading-none">Gyra Admin</span>
            <span className="text-[10px] text-zinc-500">Control Center</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← App
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* TABS */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedReport(null); setSearchQuery(""); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-white text-black shadow-lg"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ============ OVERVIEW ============ */}
        {activeTab === "Overview" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Visitors", value: totalVisitors, icon: "👁️", color: "from-blue-500 to-blue-700" },
                { label: "Unique Visitors", value: uniqueVisitors, icon: "✨", color: "from-purple-500 to-purple-700" },
                { label: "Registered Users", value: registeredUsers, icon: "👥", color: "from-green-500 to-green-700" },
                { label: "Open Reports", value: openReports, icon: "⚠️", color: "from-yellow-500 to-yellow-700" },
                { label: "Live Broadcasts", value: activeBroadcasts, icon: "📢", color: "from-red-500 to-red-700" },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-3xl`}></div>
                  <p className="text-2xl mb-2">{stat.icon}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Reports */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Latest Reports</h3>
                  <button onClick={() => setActiveTab("Reports")} className="text-xs text-blue-400 hover:text-blue-300">View all →</button>
                </div>
                <div className="flex flex-col gap-3">
                  {reports.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-start gap-3 pb-3 border-b border-zinc-800/50 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${r.status === "open" ? "bg-yellow-500" : "bg-green-500"}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{r.email}</p>
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && <p className="text-sm text-zinc-500">No reports yet.</p>}
                </div>
              </div>

              {/* Recent Visitors */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Recent Visitors</h3>
                  <button onClick={() => setActiveTab("Visitors")} className="text-xs text-blue-400 hover:text-blue-300">View all →</button>
                </div>
                <div className="flex flex-col gap-3">
                  {visitors.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-start gap-3 pb-3 border-b border-zinc-800/50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{v.country || "Unknown"}</p>
                        <p className="text-xs text-zinc-500 truncate">{v.path || "/"}</p>
                      </div>
                    </div>
                  ))}
                  {visitors.length === 0 && <p className="text-sm text-zinc-500">No visitors yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ BROADCAST ============ */}
        {activeTab === "Broadcast" && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Broadcast to all users</h2>
            <p className="text-sm text-zinc-500 mb-6">This message will appear on every logged-in user's dashboard for 24 hours.</p>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                    placeholder="e.g. New feature available!"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Message</label>
                  <textarea
                    value={bcMessage}
                    onChange={(e) => setBcMessage(e.target.value)}
                    placeholder="Write the announcement text here..."
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "info", label: "ℹ️ Info", color: "bg-blue-600" },
                      { id: "success", label: "✅ Success", color: "bg-green-600" },
                      { id: "warning", label: "⚠️ Warning", color: "bg-yellow-600" },
                      { id: "alert", label: "🚨 Alert", color: "bg-red-600" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setBcType(t.id)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          bcType === t.id
                            ? `${t.color} text-white border-transparent`
                            : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={createBroadcast}
                  disabled={bcPosting || !bcTitle.trim() || !bcMessage.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-full font-semibold transition-colors disabled:opacity-50"
                >
                  {bcPosting ? "Posting..." : bcSuccess ? "✓ Broadcast Sent!" : "Send Broadcast"}
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Broadcast History ({broadcasts.length})</h3>
            <div className="flex flex-col gap-3">
              {broadcasts.map((b) => {
                const expired = new Date(b.expires_at) < new Date();
                return (
                  <div key={b.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{b.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(b.created_at).toLocaleString()} •{" "}
                          Expires {new Date(b.expires_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          expired ? "bg-zinc-800 text-zinc-500" :
                          b.active ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {expired ? "Expired" : b.active ? "Live" : "Paused"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 mb-4">{b.message}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleBroadcast(b.id, b.active)}
                        className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800"
                      >
                        {b.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => deleteBroadcast(b.id)}
                        className="text-xs px-3 py-1.5 bg-red-600/20 border border-red-600/50 text-red-400 rounded-full hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {broadcasts.length === 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
                  <p className="text-zinc-500">No broadcasts sent yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ REPORTS ============ */}
        {activeTab === "Reports" && (
          <div>
            {selectedReport ? (
              <div>
                <button onClick={() => setSelectedReport(null)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6">
                  ← Back to Reports
                </button>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedReport.title}</h2>
                      <p className="text-sm text-zinc-500">
                        From <span className="text-white">{selectedReport.name}</span> • <span className="text-blue-400">{selectedReport.email}</span>
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      selectedReport.status === "open"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                    }`}>
                      {selectedReport.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mb-6">
                    Submitted on {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                  <div className="bg-black border border-zinc-800 rounded-xl p-5 mb-6">
                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedReport.status !== "resolved" && (
                      <button onClick={() => updateReportStatus(selectedReport.id, "resolved")} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-medium">
                        Mark as Resolved
                      </button>
                    )}
                    {selectedReport.status === "resolved" && (
                      <button onClick={() => updateReportStatus(selectedReport.id, "open")} className="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-full text-sm font-medium">
                        Reopen
                      </button>
                    )}
                    <a href={`mailto:${selectedReport.email}?subject=Re: ${selectedReport.title}`} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium">
                      Reply via Email
                    </a>
                    <button onClick={() => deleteReport(selectedReport.id)} className="bg-red-600/20 border border-red-600/50 text-red-400 px-5 py-2.5 rounded-full text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold">Reports ({reports.length})</h2>
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 w-full md:w-64"
                  />
                </div>
                {filteredReports.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
                    <p className="text-zinc-500">No reports found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredReports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold mb-1 truncate">{report.title}</p>
                            <p className="text-xs text-zinc-500 truncate">{report.name} • {report.email}</p>
                            <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{report.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full ${report.status === "open" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                              {report.status}
                            </span>
                            <p className="text-[10px] text-zinc-600 mt-2">{new Date(report.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ CHATS ============ */}
        {activeTab === "Chats" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold">All Chats ({chats.length})</h2>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 w-full md:w-64"
              />
            </div>
            {filteredChats.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
                <p className="text-zinc-500">No chats found.</p>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                      <tr>
                        <th className="text-left p-4">Title</th>
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChats.map((chat) => (
                        <tr key={chat.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                          <td className="p-4 max-w-xs truncate">{chat.title}</td>
                          <td className="p-4 text-zinc-500 font-mono text-xs">{chat.user_id?.substring(0, 8)}...</td>
                          <td className="p-4">
                            {chat.pinned ? <span className="text-blue-400 text-xs">📌 Pinned</span> : <span className="text-zinc-600 text-xs">Normal</span>}
                          </td>
                          <td className="p-4 text-zinc-500 text-xs">{new Date(chat.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ VISITORS ============ */}
        {activeTab === "Visitors" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Visitors ({visitors.length})</h2>
            {visitors.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
                <p className="text-zinc-500">No visitors tracked yet.</p>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                      <tr>
                        <th className="text-left p-4">Country</th>
                        <th className="text-left p-4">City</th>
                        <th className="text-left p-4">Path</th>
                        <th className="text-left p-4">Signed In?</th>
                        <th className="text-left p-4">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((v) => (
                        <tr key={v.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                          <td className="p-4">{v.country || "—"}</td>
                          <td className="p-4 text-zinc-500">{v.city || "—"}</td>
                          <td className="p-4 text-zinc-500 font-mono text-xs">{v.path || "/"}</td>
                          <td className="p-4">
                            {v.user_id ? <span className="text-green-400 text-xs">✓ Yes</span> : <span className="text-zinc-600 text-xs">No</span>}
                          </td>
                          <td className="p-4 text-zinc-500 text-xs">{new Date(v.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

// 🔒 Only this email can access the admin panel
const ADMIN_EMAIL = "victorylordhimself@gmail.com";

type Report = {
  id: string;
  name: string;
  email: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
};

type Chat = {
  id: string;
  title: string;
  user_id: string;
  pinned: boolean;
  created_at: string;
};

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  const [reports, setReports] = useState<Report[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (!user || user.email !== ADMIN_EMAIL) return;

      const { data: reportsData } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (reportsData) setReports(reportsData);

      const { data: chatsData } = await supabase
        .from("chats")
        .select("*")
        .order("created_at", { ascending: false });
      if (chatsData) setChats(chatsData);
    };
    init();
  }, []);

  // --- Access Control ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">🚫 Access Denied</h1>
        <p className="text-zinc-500 mb-2">
          {user ? `You are signed in as ${user.email}` : "You are not signed in"}
        </p>
        <p className="text-zinc-500 mb-8">This area is reserved for Gyra administrators.</p>
        <a
          href="/dashboard"
          className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  // --- Stats ---
  const uniqueUsers = new Set(chats.map((c) => c.user_id)).size;
  const openReports = reports.filter((r) => r.status === "open").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  // --- Filtering ---
  const filteredReports = reports.filter((r) =>
    (r.title + r.email + r.description)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter((c) =>
    (c.title + c.user_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateReportStatus = async (id: string, newStatus: string) => {
    await supabase.from("reports").update({ status: newStatus }).eq("id", id);
    setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    await supabase.from("reports").delete().eq("id", id);
    setReports(reports.filter((r) => r.id !== id));
    setSelectedReport(null);
  };

  const TABS = ["Overview", "Reports", "Chats", "Activity"];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* TOP BAR */}
      <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-lg">
            G
          </div>
          <div>
            <span className="font-bold tracking-tighter text-lg block leading-none">Gyra Admin</span>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Active Users", value: uniqueUsers, color: "from-blue-500 to-blue-700", icon: "👥" },
                { label: "Total Chats", value: chats.length, color: "from-green-500 to-green-700", icon: "💬" },
                { label: "Open Reports", value: openReports, color: "from-yellow-500 to-yellow-700", icon: "⚠️" },
                { label: "Resolved", value: resolvedReports, color: "from-purple-500 to-purple-700", icon: "✅" },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl`}></div>
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

              {/* Recent Chats */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Latest Chats</h3>
                  <button onClick={() => setActiveTab("Chats")} className="text-xs text-blue-400 hover:text-blue-300">View all →</button>
                </div>
                <div className="flex flex-col gap-3">
                  {chats.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-start gap-3 pb-3 border-b border-zinc-800/50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chats.length === 0 && <p className="text-sm text-zinc-500">No chats yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ REPORTS ============ */}
        {activeTab === "Reports" && (
          <div>
            {selectedReport ? (
              /* --- REPORT DETAIL VIEW --- */
              <div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Reports
                </button>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedReport.title}</h2>
                      <p className="text-sm text-zinc-500">
                        From <span className="text-white">{selectedReport.name}</span> •{" "}
                        <span className="text-blue-400">{selectedReport.email}</span>
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      selectedReport.status === "open"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : selectedReport.status === "resolved"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {selectedReport.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 mb-6">
                    Submitted on {new Date(selectedReport.created_at).toLocaleString()}
                  </p>

                  <div className="bg-black border border-zinc-800 rounded-xl p-5 mb-6">
                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedReport.status !== "resolved" && (
                      <button
                        onClick={() => { updateReportStatus(selectedReport.id, "resolved"); setSelectedReport({ ...selectedReport, status: "resolved" }); }}
                        className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    )}
                    {selectedReport.status === "resolved" && (
                      <button
                        onClick={() => { updateReportStatus(selectedReport.id, "open"); setSelectedReport({ ...selectedReport, status: "open" }); }}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                    <a
                      href={`mailto:${selectedReport.email}?subject=Re: ${selectedReport.title}`}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                    >
                      Reply via Email
                    </a>
                    <button
                      onClick={() => deleteReport(selectedReport.id)}
                      className="bg-red-600/20 border border-red-600/50 hover:bg-red-600/30 text-red-400 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* --- REPORTS LIST --- */
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
                            <p className="text-xs text-zinc-500 truncate">
                              {report.name} • {report.email}
                            </p>
                            <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                              {report.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              report.status === "open"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}>
                              {report.status}
                            </span>
                            <p className="text-[10px] text-zinc-600 mt-2">
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
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
                          <td className="p-4 text-zinc-500 font-mono text-xs">
                            {chat.user_id?.substring(0, 8)}...
                          </td>
                          <td className="p-4">
                            {chat.pinned ? (
                              <span className="text-blue-400 text-xs">📌 Pinned</span>
                            ) : (
                              <span className="text-zinc-600 text-xs">Normal</span>
                            )}
                          </td>
                          <td className="p-4 text-zinc-500 text-xs">
                            {new Date(chat.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ ACTIVITY ============ */}
        {activeTab === "Activity" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Platform Activity</h2>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-col gap-4">
                {[...reports.map((r) => ({ type: "report", title: `New report: ${r.title}`, subtitle: r.email, date: r.created_at })),
                  ...chats.map((c) => ({ type: "chat", title: `New chat: ${c.title}`, subtitle: c.user_id?.substring(0, 8) || "", date: c.created_at }))
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 30)
                  .map((item, i) => (
                    <div key={i} className="flex items-start gap-3 pb-4 border-b border-zinc-800/50 last:border-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        item.type === "report" ? "bg-yellow-500" : "bg-blue-500"
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {item.subtitle} • {new Date(item.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                {reports.length === 0 && chats.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No activity yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
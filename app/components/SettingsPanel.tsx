"use client";

import { useEffect, useState } from "react";

type SettingsPanelProps = {
  user: any;
  onClose: () => void;
  onLogout: () => void;
};

const SECTIONS = [
  { id: "Account", icon: "👤" },
  { id: "Appearance", icon: "🌗" },
  { id: "Behavior", icon: "🎯" },
  { id: "Notifications", icon: "🔔" },
  { id: "Customize", icon: "🎨" },
  { id: "Data & Information", icon: "📄" },
  { id: "Data Controls", icon: "🗄️" },
];

export default function SettingsPanel({
  user,
  onClose,
  onLogout,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState("Account");

  // Local settings state (persists per session for now)
  const [appearance, setAppearance] = useState<"system" | "light" | "dark">(
    "system"
  );
  const [behavior, setBehavior] = useState("Balanced");
  const [language, setLanguage] = useState("English");
  const [birthYear, setBirthYear] = useState("2000");
  const [notifReplies, setNotifReplies] = useState(true);
  const [notifProduct, setNotifProduct] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customPersonality, setCustomPersonality] = useState("Default");

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (appearance === "light") {
      root.style.colorScheme = "light";
      document.body.style.background = "#ffffff";
      document.body.style.color = "#000000";
    } else if (appearance === "dark") {
      root.style.colorScheme = "dark";
      document.body.style.background = "#000000";
      document.body.style.color = "#ffffff";
    } else {
      root.style.colorScheme = "system";
      document.body.style.background = "";
      document.body.style.color = "";
    }
  }, [appearance]);

  return (
    <div className="absolute inset-0 bg-black z-[70] flex flex-col overflow-hidden">
      {/* ============ TOP BAR ============ */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-zinc-800/50 shrink-0">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Close settings"
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
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* ============ BODY ============ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar of sections */}
        <aside className="w-48 md:w-56 border-r border-zinc-800/50 overflow-y-auto shrink-0 bg-black">
          <div className="py-3">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <span className="text-base">{section.icon}</span>
                <span className="truncate">{section.id}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ============ ACCOUNT ============ */}
          {activeSection === "Account" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-6">
                Account
              </h3>

              {/* User card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {user?.email?.[0]?.toUpperCase() || "V"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    alert(
                      "Account management coming soon. Your account is secure."
                    )
                  }
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium px-4 py-2 rounded-full transition-colors shrink-0"
                >
                  Manage
                </button>
              </div>

              {/* X account */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-white text-lg font-bold">𝕏</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">X Account</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Link your X account for personalized features.
                  </p>
                </div>
                <button
                  onClick={() =>
                    alert("X account integration coming in a future update.")
                  }
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium px-4 py-2 rounded-full transition-colors shrink-0"
                >
                  Connect
                </button>
              </div>

              {/* Language + Birth year */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Currently: {language}
                    </p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full text-xs px-3 py-1.5 outline-none focus:border-blue-500"
                  >
                    {[
                      "English",
                      "Español",
                      "Français",
                      "Deutsch",
                      "Português",
                      "Italiano",
                      "العربية",
                      "हिन्दी",
                      "日本語",
                      "한국어",
                      "中文",
                      "Русский",
                      "Yoruba",
                      "Igbo",
                      "Hausa",
                      "Swahili",
                      "Zulu",
                      "Afrikaans",
                    ].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">Birth Year</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Used for personalization
                    </p>
                  </div>
                  <input
                    type="text"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    maxLength={4}
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded-full text-xs px-3 py-1.5 outline-none focus:border-blue-500 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============ APPEARANCE ============ */}
          {activeSection === "Appearance" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Appearance
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                Choose how Gyra looks on your screen.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  {
                    id: "system" as const,
                    title: "System",
                    desc: "Follow your device settings",
                    preview: ["bg-white", "bg-black"],
                  },
                  {
                    id: "light" as const,
                    title: "Light",
                    desc: "Bright and clean",
                    preview: ["bg-white", "bg-zinc-200"],
                  },
                  {
                    id: "dark" as const,
                    title: "Dark",
                    desc: "Dim and easy on the eyes",
                    preview: ["bg-zinc-900", "bg-black"],
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAppearance(opt.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      appearance === opt.id
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}
                  >
                    {/* Preview swatch */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-800 flex shrink-0">
                      <div className={`flex-1 ${opt.preview[0]}`} />
                      <div className={`flex-1 ${opt.preview[1]}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{opt.desc}</p>
                    </div>
                    {appearance === opt.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-white"
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
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-600 mt-6">
                Theme changes apply immediately.
              </p>
            </div>
          )}

          {/* ============ BEHAVIOR ============ */}
          {activeSection === "Behavior" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Behavior
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                Choose how Gyra responds to you.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  {
                    id: "Concise",
                    desc: "Short, direct answers",
                  },
                  {
                    id: "Balanced",
                    desc: "A mix of detail and brevity",
                  },
                  {
                    id: "Detailed",
                    desc: "Long, thorough answers",
                  },
                  {
                    id: "Creative",
                    desc: "More expressive and imaginative",
                  },
                  {
                    id: "Professional",
                    desc: "Formal and precise",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setBehavior(opt.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      behavior === opt.id
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{opt.id}</p>
                      <p className="text-xs text-zinc-500 mt-1">{opt.desc}</p>
                    </div>
                    {behavior === opt.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-white"
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
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============ NOTIFICATIONS ============ */}
          {activeSection === "Notifications" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Notifications
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                Control what Gyra tells you about.
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
                {[
                  {
                    label: "Response notifications",
                    desc: "Get notified when Gyra finishes thinking",
                    value: notifReplies,
                    set: setNotifReplies,
                  },
                  {
                    label: "Product updates",
                    desc: "New features and announcements",
                    value: notifProduct,
                    set: setNotifProduct,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-5 gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                        item.value ? "bg-white" : "bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                          item.value ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-600 mt-6">
                Notifications currently work on mobile only. Web push coming
                soon.
              </p>
            </div>
          )}

          {/* ============ CUSTOMIZE ============ */}
          {activeSection === "Customize" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Customize Gyra
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                Personalize how Gyra behaves.
              </p>

              <p className="text-sm font-medium mb-3">Personality</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Default", "Friendly", "Witty", "Direct", "Patient"].map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setCustomPersonality(p)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        customPersonality === p
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <p className="text-sm font-medium mb-3">Custom instructions</p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={5}
                placeholder="Tell Gyra how to respond to you. Example: 'Keep answers short and skip the disclaimers.'"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-zinc-600 mt-3">
                These apply to all new conversations.
              </p>
            </div>
          )}

          {/* ============ DATA & INFORMATION ============ */}
          {activeSection === "Data & Information" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-6">
                Data & Information
              </h3>

              <div className="flex flex-col gap-3">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Terms of Use</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Legal terms for using Gyra
                    </p>
                  </div>
                  <span className="text-zinc-600">↗</span>
                </a>

                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Privacy Policy</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      How we handle your data
                    </p>
                  </div>
                  <span className="text-zinc-600">↗</span>
                </a>

                <button
                  onClick={() =>
                    window.open("mailto:support@gyra.ng", "_blank")
                  }
                  className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">Report a Problem</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Email support@gyra.ng
                    </p>
                  </div>
                  <span className="text-zinc-600">↗</span>
                </button>
              </div>
            </div>
          )}

          {/* ============ DATA CONTROLS ============ */}
          {activeSection === "Data Controls" && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Data Controls
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                Manage your data and conversations.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() =>
                    alert(
                      "Export coming soon. Your data is always available to you."
                    )
                  }
                  className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">Export your data</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Download all your conversations
                    </p>
                  </div>
                  <span className="text-zinc-600">→</span>
                </button>

                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "Sign out of Gyra? You can sign back in anytime."
                      )
                    )
                      return;
                    onLogout();
                  }}
                  className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-red-600/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm text-red-400">
                      Sign out
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Log out of your account on this device
                    </p>
                  </div>
                  <span className="text-zinc-600">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
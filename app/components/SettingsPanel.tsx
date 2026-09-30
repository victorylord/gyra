"use client";

import { useEffect, useState } from "react";
import { useVoiceSettings } from "./voiceSettings";
import { useTheme, type ThemeMode } from "./ThemeProvider";
import SettingsGroup from "./settings/SettingsGroup";
import SettingsRow from "./settings/SettingsRow";
import RadioModal from "./settings/RadioModal";
import VoiceCarousel from "./settings/VoiceCarousel";
import AccountPage from "./settings/pages/AccountPage";
import DataControlsPage from "./settings/pages/DataControlsPage";
import FontSizePage from "./settings/pages/FontSizePage";
import PersonalizationPage from "./settings/pages/PersonalizationPage";
import ServiceAgreementPage from "./settings/pages/ServiceAgreementPage";
import SharedLinksPage from "./settings/pages/SharedLinksPage";

type SettingsPanelProps = {
  user: any;
  onClose: () => void;
  onLogout: () => void;
};

type SubPage =
  | null
  | "account"
  | "dataControls"
  | "fontSize"
  | "personalization"
  | "serviceAgreement"
  | "sharedLinks";

const APP_VERSION = "1.1.0";

const LANGUAGES = [
  { id: "system", label: "System" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
  { id: "de", label: "Deutsch" },
  { id: "pt", label: "Português" },
  { id: "ar", label: "العربية" },
  { id: "hi", label: "हिन्दी" },
  { id: "yo", label: "Yoruba" },
  { id: "ig", label: "Igbo" },
  { id: "ha", label: "Hausa" },
  { id: "sw", label: "Swahili" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
  { id: "ru", label: "Русский" },
];

export default function SettingsPanel({
  user,
  onClose,
  onLogout,
}: SettingsPanelProps) {
  const { theme: themeMode, setTheme } = useTheme();
  const { settings: voiceSettings } = useVoiceSettings();

  const [subPage, setSubPage] = useState<SubPage>(null);
  const [language, setLanguage] = useState("system");
  const [mainLanguage, setMainLanguage] = useState("system");

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showMainLanguageModal, setShowMainLanguageModal] = useState(false);
  const [showVoiceCarousel, setShowVoiceCarousel] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem("gyra:language");
      const ml = localStorage.getItem("gyra:main-language");
      if (l) setLanguage(l);
      if (ml) setMainLanguage(ml);
    } catch {}
  }, []);

  const saveLanguage = (v: string) => {
    setLanguage(v);
    try {
      localStorage.setItem("gyra:language", v);
    } catch {}
  };

  const saveMainLanguage = (v: string) => {
    setMainLanguage(v);
    try {
      localStorage.setItem("gyra:main-language", v);
    } catch {}
  };

  const languageLabel =
    LANGUAGES.find((l) => l.id === language)?.label || "System";

  const mainLanguageLabel =
    mainLanguage === "system"
      ? "Use App language"
      : LANGUAGES.find((l) => l.id === mainLanguage)?.label || "Use App language";

  const appearanceLabel =
    themeMode === "system"
      ? "System"
      : themeMode === "light"
      ? "Light"
      : "Dark";

  const voiceName =
    voiceSettings.voiceId.charAt(0).toUpperCase() +
    voiceSettings.voiceId.slice(1);

  return (
    <div className="absolute inset-0 bg-[var(--background)] text-[var(--foreground)] z-[70] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-2)] transition-colors"
          aria-label="Close settings"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Profile */}
          <SettingsGroup title="Profile">
            <SettingsRow
              icon={<span>👤</span>}
              label="Account settings"
              onClick={() => setSubPage("account")}
            />
            <SettingsRow
              icon={<span>🗄️</span>}
              label="Data controls"
              onClick={() => setSubPage("dataControls")}
            />
          </SettingsGroup>

          {/* App */}
          <SettingsGroup title="App">
            <SettingsRow
              icon={<span>🌐</span>}
              label="Language"
              value={languageLabel}
              onClick={() => setShowLanguageModal(true)}
            />
            <SettingsRow
              icon={<span>🌗</span>}
              label="Appearance"
              value={appearanceLabel}
              onClick={() => setShowAppearanceModal(true)}
            />
            <SettingsRow
              icon={<span>🅰️</span>}
              label="Font size"
              onClick={() => setSubPage("fontSize")}
            />
            <SettingsRow
              icon={<span>✨</span>}
              label="Personalization"
              onClick={() => setSubPage("personalization")}
            />
          </SettingsGroup>

          {/* Audio */}
          <SettingsGroup title="Audio">
            <SettingsRow
              icon={<span>🎙️</span>}
              label="Main language"
              value={mainLanguageLabel}
              onClick={() => setShowMainLanguageModal(true)}
            />
            <SettingsRow
              icon={<span>🔊</span>}
              label="Voice"
              value={voiceName}
              onClick={() => setShowVoiceCarousel(true)}
            />
          </SettingsGroup>
          <p className="text-xs text-[var(--muted)] -mt-4 mb-6 px-1 leading-relaxed">
            Select the primary language you use for voice input to achieve
            better recognition results.
          </p>

          {/* About */}
          <SettingsGroup title="About">
            <SettingsRow
              icon={<span>ℹ️</span>}
              label="Check for updates"
              value={`${APP_VERSION} (latest)`}
              showChevron={false}
            />
            <SettingsRow
              icon={<span>📄</span>}
              label="Service agreement"
              onClick={() => setSubPage("serviceAgreement")}
            />
          </SettingsGroup>

          {/* Help */}
          <SettingsGroup>
            <SettingsRow
              icon={<span>❓</span>}
              label="Help & Feedback"
              onClick={() =>
                window.open("mailto:support@gyra.ng", "_blank")
              }
            />
          </SettingsGroup>

          {/* Log out */}
          <SettingsGroup>
            <SettingsRow
              icon={<span>↪️</span>}
              label="Log out"
              danger
              onClick={() => {
                if (confirm("Log out of Gyra on this device?")) onLogout();
              }}
            />
          </SettingsGroup>

          <p className="text-center text-xs text-[var(--muted)] mt-6 px-4 leading-relaxed">
            Gyra is built by Genvia AI Company. Content is AI-generated and
            may be inaccurate — verify important information.
          </p>
        </div>
      </div>

      {/* Modals */}
      <RadioModal
        open={showLanguageModal}
        title="Language"
        icon="🌐"
        options={LANGUAGES}
        value={language}
        onSelect={saveLanguage}
        onClose={() => setShowLanguageModal(false)}
        onConfirm={() => setShowLanguageModal(false)}
      />

      <RadioModal<ThemeMode>
        open={showAppearanceModal}
        title="Appearance"
        options={[
          { id: "system", label: "System" },
          { id: "light", label: "Light" },
          { id: "dark", label: "Dark" },
        ]}
        value={themeMode}
        onSelect={(v) => setTheme(v)}
        onClose={() => setShowAppearanceModal(false)}
        onConfirm={() => setShowAppearanceModal(false)}
      />

      <RadioModal
        open={showMainLanguageModal}
        title="Main language"
        icon="🎙️"
        options={[
          { id: "system", label: "Use App language" },
          ...LANGUAGES.filter((l) => l.id !== "system"),
        ]}
        value={mainLanguage}
        onSelect={saveMainLanguage}
        onClose={() => setShowMainLanguageModal(false)}
        onConfirm={() => setShowMainLanguageModal(false)}
      />

      {showVoiceCarousel && (
        <VoiceCarousel onConfirm={() => setShowVoiceCarousel(false)} />
      )}

      {/* Sub-pages */}
      {subPage === "account" && (
        <AccountPage onBack={() => setSubPage(null)} />
      )}
      {subPage === "dataControls" && (
        <DataControlsPage
          onBack={() => setSubPage(null)}
          onOpenSharedLinks={() => setSubPage("sharedLinks")}
        />
      )}
      {subPage === "fontSize" && (
        <FontSizePage onBack={() => setSubPage(null)} />
      )}
      {subPage === "personalization" && (
        <PersonalizationPage onBack={() => setSubPage(null)} />
      )}
      {subPage === "serviceAgreement" && (
        <ServiceAgreementPage onBack={() => setSubPage(null)} />
      )}
      {subPage === "sharedLinks" && (
        <SharedLinksPage onBack={() => setSubPage("dataControls")} />
      )}
    </div>
  );
}
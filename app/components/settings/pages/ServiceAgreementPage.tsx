"use client";

import SettingsPage from "../SettingsPage";
import SettingsGroup from "../SettingsGroup";
import SettingsRow from "../SettingsRow";

export default function ServiceAgreementPage({ onBack }: { onBack: () => void }) {
  const open = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer");

  return (
    <SettingsPage title="Service agreement" onBack={onBack}>
      <SettingsGroup>
        <SettingsRow
          label="Terms of Use"
          onClick={() => open("/terms")}
        />
        <SettingsRow
          label="Privacy Policy"
          onClick={() => open("/privacy")}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}
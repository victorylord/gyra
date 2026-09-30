"use client";

import { useState } from "react";
import SettingsPage from "../SettingsPage";
import SettingsGroup from "../SettingsGroup";
import SettingsRow from "../SettingsRow";
import ConfirmModal from "../ConfirmModal";
import { supabase } from "@/app/supabase";

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return "—";
  const [name, domain] = email.split("@");
  if (name.length <= 3) return `${name[0]}***@${domain}`;
  const first = name.slice(0, 3);
  const last = name.slice(-2);
  return `${first}*****${last}@${domain}`;
}

export default function AccountPage({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  });

  const logoutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/";
  };

  const deleteAccount = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/v1/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <SettingsPage title="Account settings" onBack={onBack}>
      <SettingsGroup title="Profile">
        <SettingsRow
          icon={<span>✉️</span>}
          label="Email"
          value={maskEmail(user?.email || "")}
          showChevron={false}
        />
        <SettingsRow
          icon={<span>🔵</span>}
          label="Google"
          value="Bound"
          showChevron={false}
        />
      </SettingsGroup>

      <button
        onClick={() => setConfirmLogoutAll(true)}
        className="w-full text-left text-sm font-medium text-red-500 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 hover:bg-[var(--card-2)] transition-colors"
      >
        Log out of all devices
      </button>

      <div className="mt-16 text-center">
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
        >
          Delete account
        </button>
      </div>

      <ConfirmModal
        open={confirmLogoutAll}
        title="Log out of all devices?"
        message="You will be signed out on every device where you're currently logged in."
        confirmLabel="Log out everywhere"
        onConfirm={logoutAll}
        onClose={() => setConfirmLogoutAll(false)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your account and all conversations. This cannot be undone."
        confirmLabel="Delete account"
        onConfirm={deleteAccount}
        onClose={() => setConfirmDelete(false)}
      />
    </SettingsPage>
  );
}
"use client";

import { useEffect, useState } from "react";
import SettingsPage from "../SettingsPage";
import SettingsGroup from "../SettingsGroup";
import SettingsRow from "../SettingsRow";
import ConfirmModal from "../ConfirmModal";
import { supabase } from "../../../../supabase";

type Props = {
  onBack: () => void;
  onOpenSharedLinks: () => void;
};

export default function DataControlsPage({ onBack, onOpenSharedLinks }: Props) {
  const [improveModel, setImproveModel] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("gyra:improve-model");
      if (v !== null) setImproveModel(v === "1");
    } catch {}
  }, []);

  const toggleImprove = () => {
    const next = !improveModel;
    setImproveModel(next);
    try {
      localStorage.setItem("gyra:improve-model", next ? "1" : "0");
    } catch {}
  };

  const deleteAllChats = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("chats").delete().eq("user_id", data.user.id);
    window.location.reload();
  };

  return (
    <SettingsPage title="Data controls" onBack={onBack}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium flex-1">
            Improve the model for everyone
          </p>
          <button
            onClick={toggleImprove}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
              improveModel ? "bg-green-500" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-transform ${
                improveModel ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
          Allow your content to be used to train our models and improve our
          services. We secure your data privacy.
        </p>
      </div>

      <SettingsGroup>
        <SettingsRow
          label="Shared links"
          onClick={onOpenSharedLinks}
        />
      </SettingsGroup>

      <button
        onClick={() => setConfirmDelete(true)}
        className="w-full text-left text-sm font-medium text-red-500 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 hover:bg-[var(--card-2)] transition-colors"
      >
        Delete all chats
      </button>

      <ConfirmModal
        open={confirmDelete}
        title="Delete all chats?"
        message="Every conversation will be permanently deleted. This cannot be undone."
        confirmLabel="Delete all"
        onConfirm={deleteAllChats}
        onClose={() => setConfirmDelete(false)}
      />
    </SettingsPage>
  );
}
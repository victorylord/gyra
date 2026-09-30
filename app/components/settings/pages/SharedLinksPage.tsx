"use client";

import { useEffect, useState } from "react";
import SettingsPage from "../SettingsPage";
import SettingsGroup from "../SettingsGroup";
import SettingsRow from "../SettingsRow";
import ConfirmModal from "../ConfirmModal";
import { supabase, getAccessToken } from "@/app/supabase";

type Share = {
  id: string;
  chat_id: string;
  created_at: string;
  revoked: boolean;
  title?: string;
};

export default function SharedLinksPage({ onBack }: { onBack: () => void }) {
  const [links, setLinks] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("shared_chats")
      .select("id, chat_id, created_at, revoked")
      .eq("user_id", userData.user.id)
      .eq("revoked", false)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch chat titles
      const chatIds = data.map((d: any) => d.chat_id);
      const { data: chats } = await supabase
        .from("chats")
        .select("id, title")
        .in("id", chatIds);
      const titleById = new Map((chats || []).map((c: any) => [c.id, c.title]));
      setLinks(
        data.map((d: any) => ({ ...d, title: titleById.get(d.chat_id) }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async () => {
    if (!revokeId) return;
    const token = await getAccessToken();
    if (!token) return;
    await fetch(`/api/v1/share/${revokeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLinks((prev) => prev.filter((l) => l.id !== revokeId));
    setRevokeId(null);
  };

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/s/${id}`
      );
    } catch {}
  };

  return (
    <SettingsPage title="Shared links" onBack={onBack}>
      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : links.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            You haven't shared any chats yet.
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Long-press any message in chat and choose Share.
          </p>
        </div>
      ) : (
        <SettingsGroup>
          {links.map((l) => (
            <SettingsRow
              key={l.id}
              label={l.title || "Untitled chat"}
              hint={`gyra.ng/s/${l.id} · ${new Date(
                l.created_at
              ).toLocaleDateString()}`}
              onClick={() => copyLink(l.id)}
              rightSlot={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevokeId(l.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1"
                >
                  Revoke
                </button>
              }
            />
          ))}
        </SettingsGroup>
      )}

      <p className="text-xs text-[var(--muted)] mt-6 leading-relaxed">
        Tap a link to copy it. Revoking stops anyone from accessing it.
      </p>

      <ConfirmModal
        open={!!revokeId}
        title="Revoke this link?"
        message="Anyone with this link will no longer be able to view the conversation."
        confirmLabel="Revoke"
        onConfirm={revoke}
        onClose={() => setRevokeId(null)}
      />
    </SettingsPage>
  );
}
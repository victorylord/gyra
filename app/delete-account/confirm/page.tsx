"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function ConfirmDeletionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Invalid or missing token.");
      return;
    }

    const processDeletion = async () => {
      try {
        // Call the backend to wipe the user
        const res = await fetch("/api/delete-account/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to delete account.");

        // Successfully deleted, log out the local session just in case
        await supabase.auth.signOut();
        setStatus("success");

        // Redirect to home after 5 seconds
        setTimeout(() => router.push("/"), 5000);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    processDeletion();
  }, [token, router]);

  return (
    <div className="bg-[#120a21]/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <h1 className="text-xl font-bold text-white">Wiping Account...</h1>
          <p className="text-sm text-zinc-400">Deleting chats, keys, and projects. Please wait.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <h1 className="text-2xl font-bold text-white">Account Deleted</h1>
          <p className="text-sm text-zinc-400">
            Your account and all associated data have been permanently removed from Gyra. You will be redirected shortly.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
          <XCircle className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-bold text-white">Deletion Failed</h1>
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button onClick={() => router.push("/")} className="mt-4 bg-zinc-800 px-6 py-2 rounded-lg text-white hover:bg-zinc-700">
            Return Home
          </button>
        </div>
      )}
    </div>
  );
}

export default function ConfirmDeletion() {
  return (
    <main className="min-h-screen bg-[#0a0514] text-white flex items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
       <Suspense fallback={<Loader2 className="w-12 h-12 text-purple-500 animate-spin" />}>
         <ConfirmDeletionContent />
       </Suspense>
    </main>
  );
}
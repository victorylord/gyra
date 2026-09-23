"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home() {
  const [signupBlocked, setSignupBlocked] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleGoogleLogin = async () => {
    setChecking(true);

    try {
      // Signup throttle — max 20 signups per IP in 24h
      const geoRes = await fetch("https://ipapi.co/json/");
      const geo = await geoRes.json();
      const ipHash = btoa(geo.ip || "unknown").substring(0, 16);

      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { count } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gt("created_at", oneDayAgo);

      if (count && count > 20) {
        setSignupBlocked(true);
        setChecking(false);
        return;
      }
    } catch (e) {
      // Fail open — if the check fails, let the user log in
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col items-center w-full max-w-sm relative z-10">
        {/* Logo */}
        <h1 className="text-6xl font-bold tracking-tighter mb-4 select-none">
          Gyra
        </h1>
        <p className="text-zinc-500 mb-20 text-sm">
          Intelligent. Simplified.
        </p>

        {/* Login Buttons */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={handleGoogleLogin}
            disabled={checking || signupBlocked}
            className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-full text-base font-medium text-white border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#fff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#fff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#fff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {checking ? "Checking..." : "Continue with Google"}
          </button>

          <button className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-full text-base font-medium text-white border border-zinc-800">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M22 7L13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Continue with Email
          </button>
        </div>

        {signupBlocked && (
          <div className="mt-6 bg-red-950/50 border border-red-500/30 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-300">
              Too many signup attempts from your network. Please try again later.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="mt-12 text-sm text-zinc-600 text-center leading-relaxed">
          By continuing you agree to{" "}
          <a href="/docs" className="text-zinc-400 hover:underline">
            Terms
          </a>{" "}
          and <br />
          <a href="/docs" className="text-zinc-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const NEXT_KEY = "watar_auth_next";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  component: LoginPage,
});

function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}

function LoginPage() {
  const { next } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (next && isSafeNext(next)) sessionStorage.setItem(NEXT_KEY, next);
    // إن كان مسجّلاً بالفعل، أعِده مباشرة
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const target = (isSafeNext(next) && next) || sessionStorage.getItem(NEXT_KEY) || "/";
        sessionStorage.removeItem(NEXT_KEY);
        window.location.href = target;
      }
    });
  }, [next]);

  async function googleSignIn() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) { setBusy(false); setError(String(result.error.message ?? result.error)); return; }
    if (result.redirected) return; // متصفح يقوم بالتوجيه
    // نجح: أُنشئت الجلسة — انتقل إلى الوجهة المحفوظة
    const target = sessionStorage.getItem(NEXT_KEY) || "/";
    sessionStorage.removeItem(NEXT_KEY);
    window.location.href = target;
  }

  async function passwordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const returnTo = sessionStorage.getItem(NEXT_KEY) || (isSafeNext(next) ? next : "/");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(returnTo)}` },
      });
      if (error) { setBusy(false); setError(error.message); return; }
      setBusy(false);
      setError("افحص بريدك لتفعيل الحساب ثم عُد لهذه الصفحة.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); setError(error.message); return; }
    sessionStorage.removeItem(NEXT_KEY);
    window.location.href = returnTo;
  }

  return (
    <main style={{ maxWidth: 420, margin: "64px auto", padding: 24, fontFamily: "system-ui", direction: "rtl" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>تسجيل الدخول</h1>
      <button
        onClick={googleSignIn}
        disabled={busy}
        style={{ width: "100%", padding: "10px 16px", marginBottom: 16, background: "#111", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}
      >
        الدخول عبر Google
      </button>
      <div style={{ textAlign: "center", color: "#999", margin: "12px 0" }}>أو</div>
      <form onSubmit={passwordSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          type="email" required placeholder="البريد الإلكتروني"
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          type="password" required placeholder="كلمة المرور" minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button disabled={busy} type="submit" style={{ padding: 10, background: "#111", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}>
          {mode === "signin" ? "دخول" : "إنشاء حساب"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        style={{ marginTop: 12, background: "none", border: 0, color: "#0645ad", cursor: "pointer" }}
      >
        {mode === "signin" ? "ليس لديك حساب؟ إنشاء حساب جديد" : "لديك حساب؟ تسجيل الدخول"}
      </button>
      {error && <p role="alert" style={{ color: "#b00020", marginTop: 12 }}>{error}</p>}
    </main>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string; client_id?: string };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthNamespace {
  const authAny = supabase.auth as unknown as { oauth: OAuthNamespace };
  return authAny.oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>تعذّر تحميل طلب التفويض</h1>
      <p>{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthApi().approveAuthorization(authorization_id)
      : await oauthApi().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("لم يُعِد خادم التفويض عنوان توجيه."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "التطبيق الطالب";

  return (
    <main style={{ maxWidth: 520, margin: "48px auto", padding: 24, fontFamily: "system-ui", direction: "rtl" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>ربط {clientName} بحسابك في وتر الإحساس</h1>
      {email && <p style={{ color: "#666", marginBottom: 12 }}>مسجّل الدخول باسم: <b>{email}</b></p>}
      <p style={{ marginBottom: 8 }}>سيتمكّن <b>{clientName}</b> من استدعاء أدوات هذا التطبيق نيابةً عنك أثناء تسجيل دخولك.</p>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>هذا لا يتخطى صلاحيات هذا التطبيق أو سياسات قاعدة البيانات.</p>
      {error && <p role="alert" style={{ color: "#b00020", marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          disabled={busy}
          onClick={() => decide(true)}
          style={{ padding: "10px 20px", background: "#111", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}
        >
          {busy ? "..." : "موافقة والربط"}
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          style={{ padding: "10px 20px", background: "#eee", color: "#111", border: 0, borderRadius: 8, cursor: "pointer" }}
        >
          رفض
        </button>
      </div>
    </main>
  );
}

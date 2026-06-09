import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Loader2, Scissors, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStr } from "@/lib/cms-strings";
import { supabase } from "@/integrations/supabase/client";
import { readSettings } from "@/lib/settings";

export const Route = createFileRoute("/haircut")({
  head: () => ({ meta: [{ title: "تجربة قصات الشعر AI — وتر الإحساس" }] }),
  component: HaircutStudio,
});

type Style = { id: string; label: string; preview: string; gender: "m" | "f" | "u" };

const STYLES: Style[] = [
  { id: "bob", label: "Bob كلاسيك", gender: "f", preview: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400" },
  { id: "long_wavy", label: "طويل متموّج", gender: "f", preview: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400" },
  { id: "pixie", label: "Pixie قصير", gender: "f", preview: "https://images.unsplash.com/photo-1595944237005-a07368e3fd9d?w=400" },
  { id: "fade", label: "Fade رياضي", gender: "m", preview: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400" },
  { id: "undercut", label: "Undercut", gender: "m", preview: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400" },
  { id: "buzz", label: "Buzz قصير جداً", gender: "m", preview: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },
  { id: "curly", label: "كيرلي طبيعي", gender: "u", preview: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400" },
  { id: "side_part", label: "Side Part أنيق", gender: "u", preview: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
];

const COLORS = [
  { id: "natural", label: "طبيعي", hex: "#3b2a1e" },
  { id: "black", label: "أسود", hex: "#0c0c0e" },
  { id: "brown", label: "بني", hex: "#6b3f1a" },
  { id: "blonde", label: "أشقر", hex: "#e0b66b" },
  { id: "auburn", label: "أحمر نحاسي", hex: "#9a3b1b" },
  { id: "ash", label: "رمادي بارد", hex: "#9a9a9a" },
];

function HaircutStudio() {
  const t = (k: string) => useStr(k);
  const [person, setPerson] = useState<string | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [gender, setGender] = useState<"m" | "f" | "u">("u");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setPerson(r.result as string);
    r.readAsDataURL(f);
  }

  async function run() {
    if (!person || !style) { toast.error("ارفع صورة واختر قصّة"); return; }
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/haircut", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, style: style.label, color: color.id, hairstyle_url: style.preview }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "فشل التجهيز");
      setResult(j.result_url);
      if (readSettings().aiTryOnLogging) {
        await supabase.from("tryon_logs").insert({
          person_url: null, garment_id: null, result_url: j.result_url,
        });
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      toast.error(m.includes("REPLICATE") ? "أضف مفتاح REPLICATE_API_TOKEN" : m);
    } finally { setBusy(false); }
  }

  const visible = STYLES.filter((s) => gender === "u" || s.gender === gender || s.gender === "u");

  return (
    <div className="min-h-screen bg-background px-5 py-8" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <Link to="/workflow" className="text-sm font-bold text-primary hover:underline">← الوحدات</Link>
        <h1 className="mt-3 text-3xl font-black">
          <Scissors className="inline size-7 text-primary" /> {t("haircut.title_1")}{" "}
          <span className="text-primary">{t("haircut.title_2")}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">شاهد نفسك بقصة جديدة قبل الذهاب للصالون — للرجال والنساء.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Upload */}
          <div className="rounded-3xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-black text-primary">صورة الوجه</p>
            <label className="relative block h-64 cursor-pointer overflow-hidden rounded-2xl bg-muted">
              {person ? <img src={person} className="size-full object-cover" alt="" /> : (
                <div className="grid size-full place-items-center text-center">
                  <div>
                    <Upload className="mx-auto size-8 text-primary" />
                    <p className="mt-2 text-sm font-bold">{t("haircut.upload_hint")}</p>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>

            <div className="mt-3 inline-flex rounded-xl border border-border bg-background p-1 text-xs font-bold">
              {([["u","الكل"],["m","رجال"],["f","نساء"]] as const).map(([g, l]) => (
                <button key={g} onClick={() => setGender(g)}
                  className={`px-3 py-1.5 rounded-lg ${gender === g ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>

            <p className="mt-4 mb-2 text-xs font-black text-primary">{t("haircut.color")}</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c.id} onClick={() => setColor(c)}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold transition ${color.id === c.id ? "border-primary" : "border-border"}`}>
                  <span className="size-3.5 rounded-full" style={{ background: c.hex }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Styles */}
          <div className="rounded-3xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-black text-primary">القصّات الترند</p>
            <div className="grid h-80 grid-cols-3 gap-2 overflow-y-auto">
              {visible.map((s) => (
                <button key={s.id} onClick={() => setStyle(s)}
                  className={`relative overflow-hidden rounded-xl border-2 transition ${style?.id === s.id ? "border-primary" : "border-border"}`}>
                  <img src={s.preview} alt={s.label} className="h-24 w-full object-cover" />
                  <p className="truncate px-1 py-1 text-[10px] font-bold bg-background/80">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={run} disabled={busy || !person || !style}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-6 py-4 text-base font-black text-primary-foreground shadow-soft disabled:opacity-50">
          {busy ? <><Loader2 className="size-5 animate-spin" /> جاري التجهيز…</> : <><Sparkles className="size-5" /> {t("haircut.run")}</>}
        </button>

        {result && (
          <div className="mt-6 rounded-3xl border border-primary/30 bg-card p-4">
            <p className="mb-2 text-sm font-bold text-primary">النتيجة</p>
            <img src={result} alt="result" className="w-full rounded-2xl" />
          </div>
        )}

        <p className="mt-6 rounded-2xl bg-accent/10 px-4 py-3 text-xs text-accent leading-relaxed">
          يعمل عبر Replicate — أضف <code>REPLICATE_API_TOKEN</code> ويمكن تخصيص النموذج عبر <code>REPLICATE_HAIRCUT_VERSION</code>.
        </p>
      </div>
    </div>
  );
}

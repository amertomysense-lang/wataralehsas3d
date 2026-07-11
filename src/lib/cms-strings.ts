// CMS Zero-Code: تحرير كل النصوص في التطبيق دون لمس الكود
// النصوص تُخزَّن سحابياً في جدول public.cms_strings ثم تُكاش محلياً — أي تعديل
// يقوم به الأدمن يظهر فوراً لكل الزبائن على كل الأجهزة.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "watar.cms.strings.v1";

// السجل الافتراضي — مفاتيح مع نصوص أصلية (Arabic)
export const DEFAULT_STRINGS: Record<string, string> = {
  "brand.name": "وتر الإحساس",
  "brand.tagline": "طباعة جدارية وأرضيات — دمج ذكي بلمسة",

  "home.badge": "وتر الإحساس · محاكي الديكور",
  "home.title_1": "حوّل جدارك إلى تحفة",
  "home.title_2": "بدمج ذكي وواقعي",
  "home.subtitle": "ارفع صورة جدارك، اسحب التصميم فوقه، اضبطه بلمسة، وأتمم طلبك بضغطة.",
  "home.cta_primary": "ابدأ الآن — محاكي الديكور",
  "home.cta_admin": "لوحة التحكم",

  "sim.badge": "محاكي الديكور",
  "sim.smart_blend": "دمج ذكي فوري",
  "sim.free_place": "ضع التصميم في أي مكان — اسحبه واضبط حجمه بحرية",
  "sim.upload_hint": "اسحب صورة جدارك — أو استخدم الكاميرا",

  "wa.cta": "تواصل واتساب",
  "checkout.title": "إتمام الطلب",
  "checkout.cod": "الدفع عند الاستلام",
  "checkout.sham": "شام كاش",
};

function readLocal(): Record<string, string> {
  if (typeof window === "undefined") return DEFAULT_STRINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_STRINGS, ...JSON.parse(raw) } : DEFAULT_STRINGS;
  } catch { return DEFAULT_STRINGS; }
}

function writeLocal(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("watar:cms"));
}

/** يقرأ أحدث النصوص من السحابة ويحدّث الكاش المحلي */
export async function refreshFromCloud(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.from("cms_strings").select("key,value");
    if (error || !data) return readLocal();
    const merged: Record<string, string> = { ...DEFAULT_STRINGS };
    for (const row of data as { key: string; value: string }[]) merged[row.key] = row.value;
    writeLocal(merged);
    return merged;
  } catch { return readLocal(); }
}

/** يحفظ مفتاحاً واحداً سحابياً + محلياً — يستخدمه الأدمن */
export async function saveString(key: string, value: string) {
  const local = { ...readLocal(), [key]: value };
  writeLocal(local);
  try {
    await supabase.from("cms_strings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  } catch (e) { console.warn("CMS cloud save failed", e); }
}

/** يحفظ دفعة كاملة سحابياً — يستخدمه الأدمن عند الاستيراد */
export async function saveStringsBatch(next: Record<string, string>) {
  writeLocal(next);
  try {
    const rows = Object.entries(next).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    if (rows.length) await supabase.from("cms_strings").upsert(rows, { onConflict: "key" });
  } catch (e) { console.warn("CMS batch save failed", e); }
}

export function readStrings(): Record<string, string> { return readLocal(); }
export function writeStrings(next: Record<string, string>) { void saveStringsBatch(next); }

/** Hook — يعطيك النصوص الحية ودالة تعديل تُزامن سحابياً */
export function useCmsStrings(): [Record<string, string>, (n: Record<string, string>) => void] {
  const [s, setS] = useState<Record<string, string>>(DEFAULT_STRINGS);
  useEffect(() => {
    setS(readLocal());
    refreshFromCloud().then(setS).catch(() => {});
    const h = () => setS(readLocal());
    window.addEventListener("watar:cms", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("watar:cms", h); window.removeEventListener("storage", h); };
  }, []);
  return [s, (n) => { void saveStringsBatch(n); setS(n); }];
}

export function useStr(key: string, fallback?: string): string {
  const [s] = useCmsStrings();
  return s[key] ?? fallback ?? DEFAULT_STRINGS[key] ?? key;
}

// طبقة بيانات مرنة للفئات — يقرأها كل الواجهات من مصدر واحد
// يمكن للأدمن إضافة/تعديل/حذف الفئات دون لمس الكود
import { useEffect, useState } from "react";

export type CategoryTab = "decor" | "fashion";

export type Category = {
  id: string;       // المعرّف المخزّن في DB (يفضّل بالإنجليزية لاتيني)
  label: string;    // الاسم العربي المعروض
  tab: CategoryTab; // ينتمي لعالم الديكور أم الأزياء
};

// كل الفئات ديكور — مجلدات جاهزة للأدمن تخص طباعة الجدران والأرضيات
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "flowers",   label: "ورود",        tab: "decor" },
  { id: "fruits",    label: "فواكه",       tab: "decor" },
  { id: "nature",    label: "طبيعة",       tab: "decor" },
  { id: "marble",    label: "رخام",        tab: "decor" },
  { id: "geometric", label: "هندسي",       tab: "decor" },
  { id: "kids",      label: "أطفال",       tab: "decor" },
  { id: "islamic",   label: "زخارف إسلامية", tab: "decor" },
  { id: "3d",        label: "ثلاثي الأبعاد", tab: "decor" },
  { id: "wood",      label: "خشب",         tab: "decor" },
  { id: "other",     label: "أخرى",        tab: "decor" },
];

const KEY = "watar.categories.v1";

export function readCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const arr = JSON.parse(raw) as Category[];
    if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_CATEGORIES;
    return arr;
  } catch { return DEFAULT_CATEGORIES; }
}

export function writeCategories(next: Category[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("watar:categories"));
}

export function useCategories(): [Category[], (n: Category[]) => void] {
  const [s, setS] = useState<Category[]>(DEFAULT_CATEGORIES);
  useEffect(() => {
    setS(readCategories());
    const h = () => setS(readCategories());
    window.addEventListener("watar:categories", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("watar:categories", h); window.removeEventListener("storage", h); };
  }, []);
  return [s, (n) => { writeCategories(n); setS(n); }];
}

/** يعيد الاسم العربي للفئة — وإن لم تكن معروفة يعيد المعرّف كما هو (مرونة كاملة) */
export function labelOf(cats: Category[], id: string | null | undefined): string {
  if (!id) return "";
  return cats.find((c) => c.id === id)?.label ?? id;
}

export function idsForTab(cats: Category[], tab: CategoryTab): string[] {
  return cats.filter((c) => c.tab === tab).map((c) => c.id);
}

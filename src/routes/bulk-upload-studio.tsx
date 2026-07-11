import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Sparkles, FolderPlus, Trash2, Wand2, Palette, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { BatchImageUploader, type BatchItem } from "@/components/BatchImageUploader";
import { useCategories, type Category } from "@/lib/categories";

export const Route = createFileRoute("/bulk-upload-studio")({
  head: () => ({
    meta: [
      { title: "استوديو تصاميم الجدران والأرضيات — وتر الإحساس" },
      { name: "description", content: "ارفع تصاميم جداريّة وأرضية بالجملة، صنّفها في مجلدات (ورود، فواكه، طبيعة…)، وتظهر فوراً في المحاكي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AdminGate title="استوديو التصاميم — للأدمن فقط"><BulkUploadStudio /></AdminGate>,
});

function slugify(s: string): string {
  const base = s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
  return base || `cat-${Date.now().toString(36)}`;
}

function BulkUploadStudio() {
  const qc = useQueryClient();
  const [cats, setCats] = useCategories();
  const decorCats = cats.filter((c) => c.tab === "decor");
  const [selected, setSelected] = useState<string>(decorCats[0]?.id ?? "other");
  const [savedCount, setSavedCount] = useState(0);
  const [storageMode, setStorageMode] = useState<"storage" | "inline">("storage");
  const [newCatName, setNewCatName] = useState("");

  function addCategory() {
    const label = newCatName.trim();
    if (!label) return;
    if (cats.some((c) => c.label === label)) { toast.error("هذا المجلد موجود مسبقاً"); return; }
    const id = slugify(label);
    const next: Category[] = [...cats, { id, label, tab: "decor" }];
    setCats(next);
    setSelected(id);
    setNewCatName("");
    toast.success(`تم إنشاء مجلد «${label}»`);
  }

  function deleteCategory(id: string) {
    if (cats.length <= 1) { toast.error("يجب إبقاء مجلد واحد على الأقل"); return; }
    if (!confirm("حذف هذا المجلد من القائمة؟ (الصور المرفوعة سابقاً تبقى محفوظة)")) return;
    const next = cats.filter((c) => c.id !== id);
    setCats(next);
    if (selected === id) setSelected(next[0]?.id ?? "other");
  }

  async function uploadOneToStorage(dataUrl: string, name: string): Promise<string> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const safe = (name || "design").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
    const path = `${selected}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.webp`;
    const { error } = await supabase.storage
      .from("design-layers")
      .upload(path, blob, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
    if (error) throw error;
    const { data } = supabase.storage.from("design-layers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handle(items: BatchItem[]) {
    if (!items.length) return;
    const rows: { title: string; image_url: string; price: number | null; type: string }[] = [];
    let useStorage = storageMode === "storage";
    for (const it of items) {
      let url = it.dataUrl;
      if (useStorage) {
        try {
          url = await uploadOneToStorage(it.dataUrl, it.name);
        } catch {
          useStorage = false;
          setStorageMode("inline");
          toast.message("سطل التخزين design-layers غير مفعّل — حفظ مضمّن مؤقتاً.");
        }
      }
      rows.push({ title: it.name || "تصميم", image_url: url, price: null, type: selected });
    }
    const { error } = await supabase.from("products").insert(rows);
    if (error) { toast.error(error.message); throw error; }
    setSavedCount((n) => n + items.length);
    // مزامنة فورية مع المحاكي — نبطل كل الاستعلامات المرتبطة بالتصاميم
    qc.invalidateQueries({ queryKey: ["decor_products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(`✓ أُضيفت ${items.length} صورة إلى مجلد «${cats.find((c) => c.id === selected)?.label ?? selected}» — ظهرت فوراً في المحاكي`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 px-4 py-6 pb-20" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <Link to="/admin" className="text-sm font-bold text-primary hover:underline">← لوحة التحكم</Link>

        <div className="mt-3 rounded-3xl border border-primary/20 bg-gradient-to-tr from-primary/10 via-background to-accent/5 p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Wand2 className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">
                استوديو تصاميم <span className="text-primary">الجدران والأرضيات</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ارفع تصاميمك ونظّمها في مجلدات (ورود، فواكه، طبيعة، رخام…). كل صورة ترفعها تنزل مباشرة كتصميم جاهز في المحاكي.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-bold text-emerald-600">
              <CheckCircle2 className="size-3.5" /> WebP تلقائي وضغط ذكي
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
              <CheckCircle2 className="size-3.5" /> يظهر فوراً في المحاكي
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-bold text-accent">
              <CheckCircle2 className="size-3.5" /> مجلدات لا محدودة
            </span>
            {savedCount > 0 && (
              <span className="ms-auto rounded-full bg-primary px-3 py-1 font-black text-primary-foreground">
                ✓ تم حفظ {savedCount.toLocaleString("ar")} صورة
              </span>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-black text-foreground">
              <Palette className="size-4 text-primary" /> ١) اختر المجلد المستهدف
            </h2>
            <span className="text-[11px] text-muted-foreground">{decorCats.length} مجلد</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {decorCats.map((c) => {
              const active = selected === c.id;
              return (
                <div key={c.id} className="group relative">
                  <button type="button" onClick={() => setSelected(c.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2 text-xs font-black transition ${
                      active
                        ? "border-primary bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-soft scale-[1.03]"
                        : "border-border bg-background text-foreground/80 hover:border-primary/50 hover:bg-primary/5"
                    }`}>
                    <ImageIcon className={`size-4 ${active ? "" : "text-primary"}`} />
                    {c.label}
                  </button>
                  <button type="button" onClick={() => deleteCategory(c.id)}
                    className="absolute -top-1.5 -left-1.5 hidden size-5 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-soft group-hover:grid"
                    title="حذف المجلد">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-primary/5 p-3">
            <FolderPlus className="size-4 text-primary" />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
              placeholder="اسم مجلد جديد… مثال: زهور استوائية، نمر، خريطة"
              className="flex-1 min-w-[180px] rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="button" onClick={addCategory}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground">
              <FolderPlus className="size-4" /> إنشاء مجلد
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-black text-foreground">
            <Sparkles className="size-4 text-primary" /> ٢) ارفع تصاميم الجدران/الأرضيات — اسحب وأفلت
          </h2>
          <BatchImageUploader
            onUploaded={handle}
            maxFiles={500}
            maxWidthPx={1400}
            maxSizeMB={0.45}
            hint={`الصور المرفوعة تُحفظ في مجلد «${cats.find((c) => c.id === selected)?.label ?? selected}» وتظهر فوراً كتصاميم جاهزة داخل المحاكي.`}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ${storageMode === "storage" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {storageMode === "storage" ? "✓ التخزين السحابي مفعّل" : "⚠ حفظ مضمّن — فعّل سطل design-layers للتخزين الدائم"}
            </span>
            <span className="text-muted-foreground">الإجمالي المحفوظ في الجلسة: {savedCount.toLocaleString("ar")}</span>
          </div>
        </section>

        <p className="mt-5 rounded-2xl bg-accent/10 px-4 py-3 text-xs text-accent leading-relaxed">
          💡 كل تصميم يُرفع هنا يصبح فوراً متاحاً في مكتبة المحاكي — الزبون يختاره ويسحبه على جداره أو أرضيته مباشرة. أنشئ مجلداً لكل نوع (ورود، فواكه، طبيعة، رخام، هندسي…) لتسهيل تصفح الزبائن حسب اهتمامهم.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Plus, Trash2, LogOut, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Design } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { logoutAdmin } from "@/lib/admin-gate";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — وتر الإحساس" }] }),
  component: () => <AdminGate title="لوحة تحكم المعرض"><AdminPage /></AdminGate>,
});

type Form = { name: string; description: string; image_url: string; category: string; price: string };
const EMPTY: Form = { name: "", description: "", image_url: "", category: "", price: "" };

function AdminPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: designs } = useQuery({
    queryKey: ["admin-designs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Design[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.image_url) {
      toast.error("الاسم ورابط الصورة مطلوبان");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: form.image_url,
      category: form.category || null,
      price: form.price ? Number(form.price) : null,
    };
    const res = editing
      ? await supabase.from("designs").update(payload).eq("id", editing)
      : await supabase.from("designs").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setForm(EMPTY); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-designs"] });
    qc.invalidateQueries({ queryKey: ["designs"] });
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا التصميم؟")) return;
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["admin-designs"] });
    qc.invalidateQueries({ queryKey: ["designs"] });
  }

  function startEdit(d: Design) {
    setEditing(d.id);
    setForm({
      name: d.name,
      description: d.description ?? "",
      image_url: d.image_url,
      category: d.category ?? "",
      price: d.price != null ? String(d.price) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            <ArrowRight className="size-4" /> المعرض
          </Link>
          <button
            onClick={() => { logoutAdmin(); location.reload(); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-4" /> خروج
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pt-6 space-y-6">
        <div className="rounded-3xl p-6 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-hero)" }}>
          <h1 className="text-2xl font-black">لوحة إدارة المعرض</h1>
          <p className="mt-1 text-sm opacity-90">أضف، عدّل، أو احذف تصاميم المنتجات.</p>
        </div>

        <form onSubmit={save} className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-foreground">
              {editing ? "تعديل تصميم" : "إضافة تصميم جديد"}
            </h2>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <X className="size-3" /> إلغاء
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المنتج *" className="rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="الفئة (مثال: غرفة نوم)" className="rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="رابط الصورة *" className="rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:col-span-2" />
            <input value={form.price} type="number" onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="السعر (ل.س)" className="rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف" rows={3} className="rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:col-span-2" />
          </div>
          <button disabled={saving} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50">
            {editing ? <Save className="size-4" /> : <Plus className="size-4" />}
            {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
        </form>

        <div className="rounded-2xl bg-card p-5 shadow-card border border-border">
          <h2 className="mb-3 text-sm font-black text-foreground">المنتجات ({designs?.length ?? 0})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {designs?.map((d) => (
              <div key={d.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                <img src={d.image_url} alt={d.name} className="size-16 rounded-lg object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 text-sm font-bold text-foreground">{d.name}</p>
                  {d.price != null && <p className="text-xs text-primary font-bold">{Number(d.price).toLocaleString("ar")} ل.س</p>}
                  {d.category && <p className="text-[11px] text-muted-foreground">{d.category}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => startEdit(d)} className="rounded-lg bg-muted p-2 text-foreground hover:bg-secondary"><Edit3 className="size-3.5" /></button>
                  <button onClick={() => remove(d.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {(!designs || designs.length === 0) && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">لا توجد منتجات بعد — أضف الأول من النموذج أعلاه.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

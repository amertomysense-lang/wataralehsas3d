import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowRight, Plus, Trash2, LogOut, Edit3, Save, X, Package, MapPin, DollarSign, ShoppingBag, Store, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Design } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/AdminGate";
import { logoutAdmin } from "@/lib/admin-gate";
import { useRegions, usePricing, type Region, type Order } from "@/lib/platform";
import { exportPlatformSnapshot } from "@/lib/export-snapshot";
import { parseCSV } from "@/lib/csv-import";


export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — وتر الإحساس" }] }),
  component: () => <AdminGate title="لوحة تحكم المعرض"><AdminPage /></AdminGate>,
});

type Tab = "products" | "regions" | "pricing" | "orders" | "vendors";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            <ArrowRight className="size-4" /> المعرض
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={async () => { try { await exportPlatformSnapshot(); toast.success("تم تصدير لقطة المنصة"); } catch (e) { toast.error("فشل التصدير"); } }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20">
              <Download className="size-3.5" /> تصدير الكود/البيانات
            </button>
            <button onClick={() => { logoutAdmin(); location.reload(); }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
              <LogOut className="size-4" /> خروج
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pt-6 space-y-6">
        <div className="rounded-3xl p-6 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-hero)" }}>
          <h1 className="text-2xl font-black">لوحة إدارة المنصة</h1>
          <p className="mt-1 text-sm opacity-90">أدر المنتجات، المناطق، الأسعار، والطلبات من مكان واحد.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <TabBtn icon={<Package className="size-4" />} label="المنتجات" active={tab === "products"} onClick={() => setTab("products")} />
          <TabBtn icon={<MapPin className="size-4" />} label="المناطق" active={tab === "regions"} onClick={() => setTab("regions")} />
          <TabBtn icon={<DollarSign className="size-4" />} label="الأسعار" active={tab === "pricing"} onClick={() => setTab("pricing")} />
          <TabBtn icon={<Store className="size-4" />} label="السوق" active={tab === "vendors"} onClick={() => setTab("vendors")} />
          <TabBtn icon={<ShoppingBag className="size-4" />} label="الطلبات" active={tab === "orders"} onClick={() => setTab("orders")} />
        </div>

        {tab === "products" && <ProductsTab />}
        {tab === "regions" && <RegionsTab />}
        {tab === "pricing" && <PricingTab />}
        {tab === "vendors" && <VendorsTab />}
        {tab === "orders" && <OrdersTab />}
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
        active ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground hover:bg-muted"
      }`}>
      {icon} {label}
    </button>
  );
}

/* ============ المنتجات ============ */
type ProdForm = { name: string; description: string; image_url: string; category: string; price: string };
const EMPTY_P: ProdForm = { name: "", description: "", image_url: "", category: "", price: "" };

function ProductsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProdForm>(EMPTY_P);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: designs } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Design[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.image_url) { toast.error("الاسم والصورة مطلوبان"); return; }
    const payload = {
      name: form.name, description: form.description || null, image_url: form.image_url,
      category: form.category || null, price: form.price ? Number(form.price) : null,
    };
    const res = editing
      ? await supabase.from("products").update(payload).eq("id", editing)
      : await supabase.from("products").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setForm(EMPTY_P); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا التصميم؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">{editing ? "تعديل تصميم" : "إضافة تصميم"}</h2>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_P); }}
              className="text-xs text-muted-foreground inline-flex items-center gap-1"><X className="size-3" /> إلغاء</button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="اسم المنتج *" />
          <Input value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="الفئة" />
          <Input value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="رابط الصورة *" full />
          <Input value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="السعر" type="number" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="الوصف" rows={2}
            className="sm:col-span-2 rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90">
          {editing ? <Save className="size-4" /> : <Plus className="size-4" />}
          {editing ? "حفظ التعديلات" : "إضافة"}
        </button>
      </form>

      <div className="rounded-2xl bg-card p-5 shadow-card border border-border">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black">المنتجات ({designs?.length ?? 0})</h2>
          <CSVImportButton
            table="products"
            sample="name,description,image_url,category,price"
            map={(row) => ({
              name: row.name, description: row.description || null,
              image_url: row.image_url, category: row.category || null,
              price: row.price ? Number(row.price) : null,
            })}
            onDone={() => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {designs?.map((d) => (
            <div key={d.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <img src={d.image_url} alt={d.name} className="size-16 rounded-lg object-cover bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-bold">{d.name}</p>
                {d.category && <p className="text-[11px] text-muted-foreground">{d.category}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => { setEditing(d.id); setForm({ name: d.name, description: d.description ?? "", image_url: d.image_url, category: d.category ?? "", price: d.price != null ? String(d.price) : "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="rounded-lg bg-muted p-2"><Edit3 className="size-3.5" /></button>
                <button onClick={() => remove(d.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ المناطق ============ */
type RegForm = { name: string; whatsapp_number: string; assistant_name: string; distance_km: string };
const EMPTY_R: RegForm = { name: "", whatsapp_number: "", assistant_name: "", distance_km: "15" };

function RegionsTab() {
  const qc = useQueryClient();
  const { data: regions } = useRegions();
  const [form, setForm] = useState<RegForm>(EMPTY_R);
  const [editing, setEditing] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.whatsapp_number) { toast.error("الاسم والرقم مطلوبان"); return; }
    const payload = { name: form.name, whatsapp_number: form.whatsapp_number.replace(/\D/g, ""), assistant_name: form.assistant_name || null, distance_km: form.distance_km ? Number(form.distance_km) : null };
    const res = editing
      ? await supabase.from("regions").update(payload).eq("id", editing)
      : await supabase.from("regions").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ");
    setForm(EMPTY_R); setEditing(null);
    qc.invalidateQueries({ queryKey: ["regions"] });
  }

  async function toggleActive(r: Region) {
    await supabase.from("regions").update({ is_active: !r.is_active }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["regions"] });
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه المنطقة؟")) return;
    await supabase.from("regions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["regions"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
        <h2 className="text-sm font-black">{editing ? "تعديل منطقة" : "إضافة منطقة جديدة"}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="اسم المنطقة (الدانا)" />
          <Input value={form.whatsapp_number} onChange={(v) => setForm({ ...form, whatsapp_number: v })} placeholder="واتساب 963xxx" />
          <Input value={form.assistant_name} onChange={(v) => setForm({ ...form, assistant_name: v })} placeholder="اسم المساعد" />
          <Input value={form.distance_km} onChange={(v) => setForm({ ...form, distance_km: v })} placeholder="المسافة كم" type="number" />
        </div>
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90">
          {editing ? <Save className="size-4" /> : <Plus className="size-4" />} {editing ? "حفظ" : "إضافة منطقة"}
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_R); }} className="text-xs text-muted-foreground">إلغاء</button>}
      </form>

      <div className="rounded-2xl bg-card p-5 shadow-card border border-border">
        <h2 className="mb-3 text-sm font-black">المناطق ({regions?.length ?? 0})</h2>
        <div className="space-y-2">
          {regions?.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex-1">
                <p className="text-sm font-bold">{r.name} {!r.is_active && <span className="text-xs text-muted-foreground">(معطّلة)</span>}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{r.whatsapp_number} · {r.assistant_name ?? "—"} · {r.distance_km ?? "—"}km</p>
              </div>
              <button onClick={() => toggleActive(r)} className="text-xs rounded-lg bg-muted px-2 py-1">{r.is_active ? "تعطيل" : "تفعيل"}</button>
              <button onClick={() => { setEditing(r.id); setForm({ name: r.name, whatsapp_number: r.whatsapp_number, assistant_name: r.assistant_name ?? "", distance_km: r.distance_km != null ? String(r.distance_km) : "" }); }}
                className="rounded-lg bg-muted p-2"><Edit3 className="size-3.5" /></button>
              <button onClick={() => remove(r.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ الأسعار ============ */
function PricingTab() {
  const qc = useQueryClient();
  const { data: pricing } = usePricing();
  const [ppm, setPpm] = useState<string>("");
  const [emb, setEmb] = useState<string>("");
  const [cur, setCur] = useState<string>("");

  function init() {
    setPpm(String(pricing?.price_per_meter ?? 25));
    setEmb(String((pricing?.embossed_premium_rate ?? 0.3) * 100));
    setCur(pricing?.currency ?? "$");
  }
  if (pricing && ppm === "") init();

  async function save() {
    const { error } = await supabase.from("pricing_config").upsert({
      id: 1, price_per_meter: Number(ppm), embossed_premium_rate: Number(emb) / 100, currency: cur, updated_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث الأسعار");
    qc.invalidateQueries({ queryKey: ["pricing"] });
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
      <h2 className="text-sm font-black">إعدادات التسعير</h2>
      <p className="text-xs text-muted-foreground">يطبق فوراً على المحاكي في كل المنتجات.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold">السعر/متر²</span>
          <input type="number" step="0.5" value={ppm} onChange={(e) => setPpm(e.target.value)}
            className="mt-1 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block">
          <span className="text-xs font-bold">نسبة البروز %</span>
          <input type="number" step="1" value={emb} onChange={(e) => setEmb(e.target.value)}
            className="mt-1 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block">
          <span className="text-xs font-bold">العملة</span>
          <input value={cur} onChange={(e) => setCur(e.target.value)}
            className="mt-1 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
      <button onClick={save} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90">
        <Save className="size-4" /> حفظ
      </button>
    </div>
  );
}

/* ============ الطلبات ============ */
function OrdersTab() {
  const qc = useQueryClient();
  const { data: regions } = useRegions();
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: orders } = useQuery({
    queryKey: ["orders", filterRegion, filterStatus],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
      if (filterRegion) q = q.eq("region_name", filterRegion);
      if (filterStatus) q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  async function setStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black">الطلبات الواردة ({orders?.length ?? 0})</h2>
        <div className="flex gap-2">
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
            className="rounded-lg bg-muted px-2 py-1 text-xs">
            <option value="">كل المناطق</option>
            {regions?.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg bg-muted px-2 py-1 text-xs">
            <option value="">كل الحالات</option>
            <option value="new">جديد</option>
            <option value="inspected">تم المعاينة</option>
            <option value="active">قيد التنفيذ</option>
            <option value="finished">منتهي</option>
            <option value="contacted">تم التواصل</option>
            <option value="done">منجز</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {orders?.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{o.design_name ?? "—"} · {o.region_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {o.width}م × {o.height}م {o.embossed ? "· بروز" : ""} · {Number(o.total).toLocaleString("ar")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("ar")}</p>
              </div>
              <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                className="rounded-lg bg-muted px-2 py-1 text-xs">
                <option value="new">جديد</option>
                <option value="inspected">تم المعاينة</option>
                <option value="active">قيد التنفيذ</option>
                <option value="finished">منتهي</option>
                <option value="contacted">تم التواصل</option>
                <option value="done">منجز</option>
                <option value="cancelled">ملغى</option>
              </select>
            </div>
          </div>
        ))}
        {(!orders || orders.length === 0) && <p className="text-center text-sm text-muted-foreground py-8">لا طلبات بعد.</p>}
      </div>
    </div>
  );
}

/* ============ السوق (Vendors) ============ */
type VendorRow = { id: string; business_name: string; category: string; whatsapp_number: string; logo_url: string | null; is_premium: boolean; region_id: string | null };
type VForm = { business_name: string; category: string; whatsapp_number: string; logo_url: string; is_premium: boolean; region_id: string };
const EMPTY_V: VForm = { business_name: "", category: "curtains", whatsapp_number: "", logo_url: "", is_premium: false, region_id: "" };

function VendorsTab() {
  const qc = useQueryClient();
  const { data: regions } = useRegions();
  const [form, setForm] = useState<VForm>(EMPTY_V);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: vendors } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VendorRow[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name || !form.whatsapp_number) { toast.error("الاسم والرقم مطلوبان"); return; }
    const payload = {
      business_name: form.business_name,
      category: form.category,
      whatsapp_number: form.whatsapp_number.replace(/\D/g, ""),
      logo_url: form.logo_url || null,
      is_premium: form.is_premium,
      region_id: form.region_id || null,
    };
    const res = editing
      ? await supabase.from("vendors").update(payload).eq("id", editing)
      : await supabase.from("vendors").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ");
    setForm(EMPTY_V); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    qc.invalidateQueries({ queryKey: ["vendors"] });
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا الشريك؟")) return;
    await supabase.from("vendors").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-vendors"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="rounded-2xl bg-card p-5 shadow-card border border-border space-y-3">
        <h2 className="text-sm font-black">{editing ? "تعديل شريك" : "إضافة شريك للسوق"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} placeholder="اسم النشاط *" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl bg-muted px-3 py-2 text-sm outline-none">
            <option value="curtains">ستائر</option>
            <option value="sofa">كنب</option>
            <option value="furniture">أثاث</option>
            <option value="fashion">أزياء</option>
            <option value="other">أخرى</option>
          </select>
          <Input value={form.whatsapp_number} onChange={(v) => setForm({ ...form, whatsapp_number: v })} placeholder="واتساب 963xxx" />
          <Input value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} placeholder="رابط الشعار" />
          <select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })}
            className="rounded-xl bg-muted px-3 py-2 text-sm outline-none">
            <option value="">— كل المناطق —</option>
            {regions?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
            مميّز (Premium)
          </label>
        </div>
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90">
          {editing ? <Save className="size-4" /> : <Plus className="size-4" />} {editing ? "حفظ" : "إضافة"}
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_V); }} className="text-xs text-muted-foreground">إلغاء</button>}
      </form>

      <div className="rounded-2xl bg-card p-5 shadow-card border border-border">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black">الشركاء ({vendors?.length ?? 0})</h2>
          <CSVImportButton
            table="vendors"
            sample="business_name,category,whatsapp_number,logo_url,is_premium"
            map={(row) => ({
              business_name: row.business_name,
              category: ["curtains","sofa","furniture","fashion","other"].includes(row.category) ? row.category : "other",
              whatsapp_number: (row.whatsapp_number || "").replace(/\D/g, ""),
              logo_url: row.logo_url || null,
              is_premium: ["true","1","yes","نعم"].includes((row.is_premium || "").toLowerCase()),
            })}
            onDone={() => qc.invalidateQueries({ queryKey: ["admin-vendors"] })}
          />
        </div>

        <div className="space-y-2">
          {vendors?.map(v => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              {v.logo_url && <img src={v.logo_url} className="size-10 rounded-lg object-cover bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{v.business_name} {v.is_premium && <span className="text-[10px] text-primary">★</span>}</p>
                <p className="text-[11px] text-muted-foreground" dir="ltr">{v.category} · {v.whatsapp_number}</p>
              </div>
              <button onClick={() => { setEditing(v.id); setForm({ business_name: v.business_name, category: v.category, whatsapp_number: v.whatsapp_number, logo_url: v.logo_url ?? "", is_premium: v.is_premium, region_id: v.region_id ?? "" }); }}
                className="rounded-lg bg-muted p-2"><Edit3 className="size-3.5" /></button>
              <button onClick={() => remove(v.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
          {(!vendors || vendors.length === 0) && <p className="text-center text-xs text-muted-foreground py-6">لا شركاء بعد. أضف أول شريك ليظهر في السوق.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============ Helpers ============ */
function Input({ value, onChange, placeholder, type = "text", full }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; full?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type}
      className={`${full ? "sm:col-span-2 " : ""}rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring`} />
  );
}

function CSVImportButton({ table, sample, map, onDone }: {
  table: string;
  sample: string;
  map: (row: Record<string, string>) => Record<string, unknown>;
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try {
      const text = await f.text();
      const rows = parseCSV(text);
      if (!rows.length) { toast.error("لا توجد صفوف في الملف"); return; }
      const payload = rows.map(map);
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      toast.success(`تم استيراد ${payload.length} صف`);
      onDone();
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      toast.error(`فشل الاستيراد: ${m}`);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  function downloadSample() {
    const blob = new Blob([sample + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${table}-sample.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={downloadSample} type="button"
        className="text-[10px] text-muted-foreground hover:text-primary underline">عيّنة CSV</button>
      <button onClick={() => ref.current?.click()} type="button" disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-50">
        <Upload className="size-3.5" /> {busy ? "..." : "استيراد CSV"}
      </button>
      <input ref={ref} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
    </div>
  );
}


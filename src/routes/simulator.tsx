import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Upload, Layers, Calculator, MapPin, Truck, ShoppingBag, X } from "lucide-react";
import { useRegions, usePricing, calcTotal, buildWhatsAppUrl } from "@/lib/platform";
import { insertOrderOrQueue, useOnlineSync } from "@/lib/offline-sync";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { CampaignSection } from "@/components/CampaignSection";
import { AiImageStudio } from "@/components/AiImageStudio";

export const Route = createFileRoute("/simulator")({
  head: () => ({ meta: [{ title: "محاكي الجدران والأرضيات — وتر الإحساس" }] }),
  component: Simulator,
});

type Layer = { id: string; name: string; url: string; opacity: number };

const PRESET_LAYERS: Layer[] = [
  { id: "calli", name: "خط عربي ذهبي", url: "https://images.unsplash.com/photo-1582034438086-c4d2c41ce8af?w=900&auto=format&fit=crop", opacity: 0.85 },
  { id: "marble", name: "رخام فاخر", url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&auto=format&fit=crop", opacity: 0.8 },
  { id: "break3d", name: "كسر جدار 3D", url: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=900&auto=format&fit=crop", opacity: 0.85 },
  { id: "epoxy", name: "إيبوكسي محيطي", url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900&auto=format&fit=crop", opacity: 0.75 },
];

function Simulator() {
  useOnlineSync();
  const [bg, setBg] = useState<string | null>(null);
  const [active, setActive] = useState<Layer | null>(null);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.5);
  const [embossed, setEmbossed] = useState(false);
  const [regionId, setRegionId] = useState("");
  const [shipping, setShipping] = useState<"self" | "company">("self");
  const [km, setKm] = useState(15);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: regions } = useRegions();
  const { data: pricing } = usePricing();
  const [settings] = useSettings();
  const region = useMemo(() => regions?.find((r) => r.id === regionId), [regions, regionId]);
  const currency = pricing?.currency ?? settings.currency;

  const baseTotal = useMemo(() => (pricing ? calcTotal(width, height, embossed, pricing) : 0),
    [pricing, width, height, embossed]);
  const shippingCost = shipping === "company" ? km * settings.fuelPerKm : 0;
  const grandTotal = baseTotal + shippingCost;

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setBg(r.result as string);
    r.readAsDataURL(f);
  }

  async function sendOrder() {
    if (!region || !pricing) { toast.error("اختر المنطقة"); return; }
    setSending(true);
    const url = buildWhatsAppUrl({
      number: region.whatsapp_number, region: region.name,
      width, height, embossed,
      designName: active?.name ?? "تصميم مخصص",
      designUrl: active?.url ?? "",
      total: grandTotal, currency,
    });
    const r = await insertOrderOrQueue({
      region_id: region.id, region_name: region.name,
      design_name: active?.name ?? "تصميم مخصص",
      design_url: active?.url ?? null,
      width, height, embossed, total: grandTotal,
      shipping_mode: shipping, shipping_cost: shippingCost,
    });
    setSending(false);
    if (r.queued) toast.info("لا يوجد اتصال — تم حفظ الطلب محلياً وسيُرسل تلقائياً.");
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-background pb-32" dir="rtl">
      <div className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/workflow" className="text-sm font-bold text-primary hover:underline">← الوحدات</Link>
          <h1 className="text-sm font-black text-foreground">محاكي الجدران والأرضيات</h1>
          <span className="w-12" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-6">
        <CampaignSection compact />
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-border bg-card p-3">
          <div className="relative h-[420px] overflow-hidden rounded-2xl bg-muted">
            {!bg ? (
              <button onClick={() => fileRef.current?.click()}
                className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Upload className="size-7" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-foreground">ارفع صورة الغرفة من كاميرا هاتفك</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG / JPG حتى 10MB</p>
                </div>
              </button>
            ) : (
              <TransformWrapper minScale={0.5} maxScale={4} doubleClick={{ disabled: true }}>
                <TransformComponent wrapperClass="!size-full" contentClass="!size-full">
                  <div className="relative size-full">
                    <img src={bg} alt="room" className="size-full object-cover" />
                    {active && (
                      <img src={active.url} alt={active.name}
                        className="absolute inset-x-6 top-10 bottom-10 mx-auto object-cover rounded-xl shadow-2xl pointer-events-none"
                        style={{ opacity: active.opacity, mixBlendMode: "multiply" }} />
                    )}
                  </div>
                </TransformComponent>
              </TransformWrapper>
            )}
            {bg && (
              <button onClick={() => { setBg(null); setActive(null); }}
                className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur">
                <X className="size-4" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
              <Layers className="size-4 text-primary" /> الطبقات الجاهزة
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESET_LAYERS.map((l) => (
                <button key={l.id} onClick={() => setActive(l)}
                  className={`group overflow-hidden rounded-xl border-2 transition ${active?.id === l.id ? "border-primary" : "border-border hover:border-primary/50"}`}>
                  <img src={l.url} alt={l.name} className="h-16 w-full object-cover" />
                  <p className="px-2 py-1 text-[11px] font-bold">{l.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><Calculator className="size-4 text-primary" /> الحاسبة</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-muted-foreground">العرض (م)</span>
                <input type="number" step={0.1} value={width} onChange={(e) => setWidth(+e.target.value)}
                  className="mt-1 w-full rounded-lg bg-muted px-2 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-muted-foreground">الارتفاع (م)</span>
                <input type="number" step={0.1} value={height} onChange={(e) => setHeight(+e.target.value)}
                  className="mt-1 w-full rounded-lg bg-muted px-2 py-2 text-sm" />
              </label>
            </div>
            <label className="mt-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
              <input type="checkbox" checked={embossed} onChange={(e) => setEmbossed(e.target.checked)} className="accent-primary" />
              <span>تفعيل ميزة البروز الملموس (Embossed) <b className="text-primary">+30%</b></span>
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-primary" /> منطقتك</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {regions?.map((r) => (
                <button key={r.id} onClick={() => setRegionId(r.id)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-bold transition ${regionId === r.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/80"}`}>
                  {r.name}
                </button>
              ))}
              {(!regions || regions.length === 0) && (
                <p className="col-span-2 text-center text-[11px] text-muted-foreground">لا توجد مناطق — أضفها من الأدمن.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><Truck className="size-4 text-primary" /> الشحن</div>
            <div className="mt-3 grid gap-2">
              <button onClick={() => setShipping("self")}
                className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${shipping === "self" ? "border-primary bg-primary/10" : "border-border"}`}>
                <span>تأمين النقل من طرفك</span>
                <span className="text-success">0.00 {currency}</span>
              </button>
              <button onClick={() => setShipping("company")}
                className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 text-xs font-bold transition ${shipping === "company" ? "border-primary bg-primary/10" : "border-border"}`}>
                <span>سيارة الشركة المدعومة</span>
                <span className="text-primary">{settings.fuelPerKm} {currency} / كم</span>
              </button>
              {shipping === "company" && (
                <>
                  <label className="block">
                    <span className="text-[11px] font-bold text-muted-foreground">المسافة المقدّرة (كم)</span>
                    <input type="number" min={0} value={km} onChange={(e) => setKm(+e.target.value)}
                      className="mt-1 w-full rounded-lg bg-muted px-2 py-2 text-sm" />
                  </label>
                  <p className="rounded-lg bg-accent/10 px-3 py-2 text-[11px] text-accent leading-relaxed">
                    💡 هذا مساهمة وقود مدعومة من الشركة — أقل بكثير من التكلفة الفعلية للنقل.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            <p className="text-xs opacity-90">الإجمالي المقدّر</p>
            <p className="mt-1 text-3xl font-black">{grandTotal.toLocaleString("ar")} {currency}</p>
            <p className="mt-1 text-[11px] opacity-80">
              طباعة: {baseTotal.toLocaleString("ar")} + شحن: {shippingCost.toLocaleString("ar")}
            </p>
            <button onClick={sendOrder} disabled={sending || !regionId}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background px-4 py-3 text-sm font-black text-foreground transition hover:opacity-90 disabled:opacity-50">
              <ShoppingBag className="size-4" /> {sending ? "..." : "إرسال عبر واتساب"}
            </button>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10">
        <AiImageStudio
          section="simulator"
          title="استوديو تصاميم الجدران بالذكاء الاصطناعي"
          subtitle="ولّد تصميم جدار/أرضية مخصصاً حسب ذوقك — ارفع صورة غرفتك ليتم التصميم على مقاسها."
          accent="from-primary to-accent"
          basePrompt="High-resolution interior wall/floor decorative design, photorealistic, premium material finish"
          presets={[
            { id: "rose", label: "حديقة ورود", prompt: "soft pink rose garden mural, romantic warm lighting" },
            { id: "calli", label: "خط عربي ذهبي", prompt: "elegant golden arabic calligraphy on dark marble" },
            { id: "marble", label: "رخام فاخر", prompt: "luxurious veined marble texture, ivory and gold" },
            { id: "3d", label: "كسر 3D", prompt: "dramatic 3D broken wall illusion, depth, cinematic" },
            { id: "epoxy", label: "إيبوكسي محيطي", prompt: "ocean epoxy resin floor with turquoise waves and sand" },
          ]}
        />
      </div>
    </div>
  );
}

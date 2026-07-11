import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Upload, Layers, Calculator, MapPin, Truck, ShoppingBag, X, Wand2, Loader2,
  Download, Camera, RefreshCw, Sliders, RotateCcw, Scissors, Check, Lock, Unlock, Target, Navigation,
} from "lucide-react";
import { useRegions, usePricing, calcTotal, buildWhatsAppUrl } from "@/lib/platform";
import { insertOrderOrQueue, useOnlineSync } from "@/lib/offline-sync";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { CampaignSection } from "@/components/CampaignSection";
import { AiImageStudio } from "@/components/AiImageStudio";
import { supabase, type Design } from "@/integrations/supabase/client";
import { useCategories, idsForTab } from "@/lib/categories";
import { toWebpQ92 } from "@/lib/webp-compress";
import { DraggableDesignLayer, resetBox, type DesignBox } from "@/components/DraggableDesignLayer";
import { DropZone } from "@/components/DropZone";

export const Route = createFileRoute("/simulator")({
  head: () => ({ meta: [{ title: "محاكي الجدران والأرضيات — وتر الإحساس" }] }),
  component: Simulator,
});

type Layer = { id: string; name: string; url: string; opacity: number };

const PRESET_LAYERS: Layer[] = [
  { id: "calli", name: "خط عربي ذهبي", url: "https://images.unsplash.com/photo-1582034438086-c4d2c41ce8af?w=900&auto=format&fit=crop", opacity: 0.9 },
  { id: "marble", name: "رخام فاخر", url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&auto=format&fit=crop", opacity: 0.9 },
  { id: "break3d", name: "كسر جدار 3D", url: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=900&auto=format&fit=crop", opacity: 0.9 },
  { id: "epoxy", name: "إيبوكسي محيطي", url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900&auto=format&fit=crop", opacity: 0.9 },
];

const DEFAULT_ROOM = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop";

const BLEND_MODES: { key: NonNullable<DesignBox["blendMode"]>; label: string }[] = [
  { key: "normal", label: "عادي" },
  { key: "multiply", label: "ضرب" },
  { key: "screen", label: "شاشة" },
  { key: "overlay", label: "تراكب" },
  { key: "soft-light", label: "ضوء ناعم" },
  { key: "hard-light", label: "ضوء حاد" },
  { key: "color-burn", label: "حرق لوني" },
  { key: "luminosity", label: "إضاءة" },
];

function Simulator() {
  useOnlineSync();
  const [bg, setBg] = useState<string | null>(DEFAULT_ROOM);
  const [active, setActive] = useState<Layer | null>(PRESET_LAYERS[1]);
  const [box, setBox] = useState<DesignBox>(resetBox());
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.5);
  const [embossed, setEmbossed] = useState(false);
  const [regionId, setRegionId] = useState("");
  const [shipping, setShipping] = useState<"self" | "company">("self");
  const [km, setKm] = useState(15);
  const [sending, setSending] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [surface, setSurface] = useState<"wall" | "floor" | "ceiling">("wall");
  const [showEffects, setShowEffects] = useState(true);
  const [wallPoints, setWallPoints] = useState<{ x: number; y: number }[]>([]);
  const [defineMode, setDefineMode] = useState(false);
  const [postEdit, setPostEdit] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [autoFitMode, setAutoFitMode] = useState(false);
  const [addressNote, setAddressNote] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Live camera state
  const [camOpen, setCamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: regions } = useRegions();
  const { data: pricing } = usePricing();
  const [settings] = useSettings();
  const region = useMemo(() => regions?.find((r) => r.id === regionId), [regions, regionId]);

  const [cats] = useCategories();
  const decorIds = idsForTab(cats, "decor");
  const { data: adminLayers } = useQuery({
    queryKey: ["decor_products", decorIds.join(",")],
    queryFn: async (): Promise<Layer[]> => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(80);
      if (decorIds.length) q = q.in("type", decorIds);
      const { data, error } = await q;
      if (error) return [];
      return ((data ?? []) as Design[]).map((d) => ({
        id: d.id, name: d.title || "تصميم", url: d.image_url, opacity: 0.9,
      }));
    },
  });
  const allLayers = useMemo(() => [...(adminLayers ?? []), ...PRESET_LAYERS], [adminLayers]);

  type Cur = "USD" | "TRY" | "SYP";
  const [currencyMode, setCurrencyMode] = useState<Cur>("USD");
  const enabledCurs: { code: Cur; sym: string; rate: number; label: string }[] = useMemo(() => {
    const arr: { code: Cur; sym: string; rate: number; label: string }[] = [
      { code: "USD", sym: "$", rate: 1, label: "USD $" },
    ];
    if (settings.enableTRY) arr.push({ code: "TRY", sym: "₺", rate: Number(settings.tryRate) || 32.5, label: "TRY ₺" });
    if (settings.enableSYP) arr.push({ code: "SYP", sym: "ل.س", rate: Number(settings.sypRate) || 14500, label: "SYP ل.س" });
    return arr;
  }, [settings.enableTRY, settings.tryRate, settings.enableSYP, settings.sypRate]);
  useEffect(() => {
    if (!enabledCurs.some((c) => c.code === currencyMode)) setCurrencyMode("USD");
  }, [enabledCurs, currencyMode]);
  const activeCur = enabledCurs.find((c) => c.code === currencyMode) ?? enabledCurs[0];
  const currency = activeCur.sym;
  const fx = activeCur.rate;

  const baseTotalUsd = useMemo(
    () => (pricing ? calcTotal(width, height, embossed, pricing) : 0),
    [pricing, width, height, embossed],
  );
  const baseTotal = baseTotalUsd * fx;
  const shippingCost = (shipping === "company" ? km * settings.fuelPerKm : 0) * fx;
  const grandTotal = baseTotal + shippingCost;

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setBg(r.result as string); setAiResult(null); };
    r.readAsDataURL(f);
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOpen(true);
    } catch {
      toast.error("تعذّر فتح الكاميرا — تأكد من منح الإذن");
    }
  }

  useEffect(() => {
    if (camOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camOpen]);

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOpen(false);
  }
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  function snapPhoto() {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    setBg(c.toDataURL("image/jpeg", 0.92));
    setAiResult(null);
    closeCamera();
    toast.success("تم التقاط الصورة — اسحب التصميم على الجدار");
  }

  async function runAiProjection() {
    if (!bg) { toast.error("التقط أو ارفع صورة الجدار أولاً"); return; }
    if (!active) { toast.error("اختر طبقة تصميم"); return; }
    setAiBusy(true); setAiResult(null);
    try {
      const res = await fetch("/api/decor-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: bg, design: active.url, design_desc: active.name,
          surface, embossed,
          placement_mode: "single-area",
          placement_note: `Placed at approx x=${Math.round(box.x)}%, y=${Math.round(box.y)}%, width=${Math.round(box.w)}%, height=${Math.round(box.h)}%, rotation=${box.rotation}°`,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.result_url) {
        setAiResult(bg);
        const region = regions?.find((r) => r.id === regionId);
        const num = region?.whatsapp_number || "963933000000";
        toast("وضع المحاكاة التجريبي ✨ — لإخراج طباعة UV حقيقية أكمل الطلب عبر واتساب", {
          duration: 8000,
          action: { label: "واتساب", onClick: () => window.open(`https://wa.me/${num}?text=${encodeURIComponent("أرغب بتنفيذ تصميم: " + active.name)}`, "_blank") },
        });
        return;
      }
      const compressed = await toWebpQ92(j.result_url, 0.92).catch(() => j.result_url);
      setAiResult(compressed);
      toast.success(j.fallback ? "تمّ الدمج عبر المحرك الاحتياطي ✨" : "تمّ الدمج التوليدي بدقّة 8K");
    } catch {
      setAiResult(bg);
      toast("وضع المحاكاة التجريبي ✨");
    } finally { setAiBusy(false); }
  }

  function downloadResult() {
    if (!aiResult) return;
    const a = document.createElement("a");
    const ext = aiResult.startsWith("data:image/webp") ? "webp" : "jpg";
    a.href = aiResult; a.download = `watar-room-${Date.now()}.${ext}`; a.click();
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
    await insertOrderOrQueue({
      region_id: region.id, region_name: region.name,
      design_name: active?.name ?? "تصميم مخصص",
      design_url: active?.url ?? null,
      width, height, embossed, total: grandTotal,
      shipping_mode: shipping, shipping_cost: shippingCost,
    });
    setSending(false);
    window.open(url, "_blank");
  }

  const previewBg = aiResult || bg;

  return (
    <div className="min-h-screen bg-background pb-40" dir="rtl">
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
          <DropZone
            hint="أفلت صورة الجدار هنا"
            onImage={(url) => { setBg(url); setAiResult(null); toast.success("تم تحديث صورة الجدار"); }}
          >
          {!previewBg ? (
            <div className="grid h-[420px] place-items-center rounded-2xl bg-muted">
              <div className="w-full max-w-sm space-y-3 px-5 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Camera className="size-7" />
                </div>
                <p className="text-sm font-black text-foreground">ابدأ بصورة جدارك</p>
                <p className="text-[11px] text-muted-foreground">اسحب صورة من سطح المكتب أو الصق (Ctrl+V) — أو استخدم الكاميرا</p>
                <button onClick={openCamera}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-4 py-3 text-sm font-black text-primary-foreground shadow-soft">
                  <Camera className="size-4" /> التقط صورة جدارك مباشرة 📸
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-xs font-bold text-foreground">
                  <Upload className="size-4" /> أو ارفع صورة من المعرض
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-2xl bg-muted"
              onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-watar-layer")) e.preventDefault(); }}
              onDrop={(e) => {
                const raw = e.dataTransfer.getData("application/x-watar-layer");
                if (!raw) return;
                try {
                  const l = JSON.parse(raw) as Layer;
                  setActive(l); setBox(resetBox()); setAiResult(null);
                  toast.success(`تم إسقاط: ${l.name}`);
                  e.preventDefault();
                } catch { /* ignore */ }
              }}
            >
              <img src={previewBg} alt="preview" className="block w-full select-none" draggable={false} />

              {/* clipped design layer — التصميم يظهر فقط داخل نطاق الجدار المحدَّد */}
              {((!aiResult || postEdit) && active) && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={wallPoints.length >= 3 ? {
                    clipPath: `polygon(${wallPoints.map((p) => `${p.x}% ${p.y}%`).join(", ")})`,
                    WebkitClipPath: `polygon(${wallPoints.map((p) => `${p.x}% ${p.y}%`).join(", ")})`,
                  } : undefined}
                >
                  <div className="pointer-events-auto absolute inset-0">
                    <DraggableDesignLayer
                      src={active.url}
                      name={active.name}
                      box={box}
                      onChange={setBox}
                      container={stageRef}
                      embossed={embossed}
                    />
                  </div>
                </div>
              )}


              {/* Wall polygon overlay + click-capture in define mode */}
              {(defineMode || wallPoints.length > 0) && (
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {wallPoints.length >= 2 && (
                    <polygon
                      points={wallPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(59,26,138,0.12)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.4}
                      strokeDasharray="1.2 0.8"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {wallPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={0.9} fill="white" stroke="hsl(var(--primary))" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
              )}
              {defineMode && (
                <button
                  aria-label="أضف نقطة للنطاق"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setWallPoints((pts) => [...pts, { x, y }]);
                  }}
                  className="absolute inset-0 cursor-crosshair bg-primary/5"
                />
              )}
              {defineMode && (
                <div className="absolute inset-x-0 top-2 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-[11px] font-black text-background shadow">
                  <Scissors className="size-3.5" />
                  انقر أطراف الجدار — {wallPoints.length} نقطة
                  <button onClick={() => setWallPoints((p) => p.slice(0, -1))} className="ms-1 rounded bg-white/15 px-1.5 py-0.5">تراجع</button>
                  <button onClick={() => setWallPoints([])} className="rounded bg-white/15 px-1.5 py-0.5">مسح</button>
                  <button onClick={() => setDefineMode(false)} className="rounded bg-success px-2 py-0.5">
                    <Check className="inline size-3" /> تم
                  </button>
                </div>
              )}

              {aiBusy && (
                <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground">
                    <Loader2 className="size-4 animate-spin" /> جارٍ الدمج بدقّة 8K…
                  </div>
                </div>
              )}
              <button onClick={() => { setBg(null); setAiResult(null); setActive(null); setWallPoints([]); setDefineMode(false); }}
                className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur">
                <X className="size-4" />
              </button>
            </div>
          )}
          </DropZone>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onUpload} />

          {/* Surface + embossed quick toggles */}
          {previewBg && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg bg-background p-1 text-[11px] font-bold">
                {([["wall", "جدار"], ["floor", "أرضية"], ["ceiling", "سقف"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setSurface(k)}
                    className={`px-2.5 py-1 rounded-md ${surface === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
                ))}
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-bold">
                <input type="checkbox" checked={embossed} onChange={(e) => setEmbossed(e.target.checked)} className="accent-primary" />
                بروز Embossed <b className="text-primary">+30%</b>
              </label>
              <button onClick={() => setBox(resetBox())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold"
                title="إعادة تعيين موضع وتأثيرات التصميم">
                <RotateCcw className="size-3.5" /> إعادة تعيين
              </button>
              <button onClick={() => { setDefineMode((v) => !v); if (!defineMode) setWallPoints([]); }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                  defineMode ? "bg-primary text-primary-foreground" : "border border-primary/40 bg-primary/10 text-primary"
                }`}
                title="ارسم نطاق الجدار بالنقر على أطرافه — التصميم سيظهر داخله فقط">
                <Scissors className="size-3.5" /> {defineMode ? "جاري التحديد…" : wallPoints.length >= 3 ? "تعديل النطاق" : "حدّد نطاق الجدار"}
              </button>
              {wallPoints.length >= 3 && !defineMode && (
                <button onClick={() => setWallPoints([])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                  title="إلغاء تحديد النطاق">
                  إلغاء النطاق
                </button>
              )}
              <button onClick={openCamera}
                className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-bold">
                <RefreshCw className="size-3.5" /> صورة جديدة
              </button>
            </div>
          )}


          {/* Effects panel */}
          {previewBg && active && !aiResult && (
            <div className="mt-3 rounded-2xl border border-border bg-card/60 p-3">
              <button
                onClick={() => setShowEffects((s) => !s)}
                className="mb-2 flex w-full items-center justify-between text-xs font-black text-foreground"
              >
                <span className="inline-flex items-center gap-2"><Sliders className="size-3.5 text-primary" /> تأثيرات التصميم</span>
                <span className="text-[10px] text-muted-foreground">{showEffects ? "إخفاء" : "إظهار"}</span>
              </button>
              {showEffects && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Slider label="الشفافية" value={box.opacity} min={0.1} max={1} step={0.05}
                    fmt={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => setBox({ ...box, opacity: v })} />
                  <Slider label="التدوير" value={box.rotation} min={-180} max={180} step={1}
                    fmt={(v) => `${v}°`}
                    onChange={(v) => setBox({ ...box, rotation: v })} />
                  <Slider label="الطمس" value={box.blur} min={0} max={12} step={0.5}
                    fmt={(v) => `${v}px`}
                    onChange={(v) => setBox({ ...box, blur: v })} />
                  <Slider label="الإشراق" value={box.brightness} min={0.5} max={1.6} step={0.05}
                    fmt={(v) => v.toFixed(2)}
                    onChange={(v) => setBox({ ...box, brightness: v })} />
                  <Slider label="التشبع" value={box.saturation} min={0.2} max={2} step={0.05}
                    fmt={(v) => v.toFixed(2)}
                    onChange={(v) => setBox({ ...box, saturation: v })} />
                  <Slider label="التباين" value={box.contrast} min={0.5} max={1.6} step={0.05}
                    fmt={(v) => v.toFixed(2)}
                    onChange={(v) => setBox({ ...box, contrast: v })} />
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-[11px] font-bold text-muted-foreground">وضع المزج مع الجدار</p>
                    <div className="flex flex-wrap gap-1.5">
                      {BLEND_MODES.map((m) => (
                        <button key={m.key} onClick={() => setBox({ ...box, blendMode: m.key })}
                          className={`rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                            box.blendMode === m.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                          }`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Layers className="size-4 text-primary" /> اختر تصميماً
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black text-primary hover:bg-primary/20">
                <Upload className="size-3" /> ارفع تصميم مرجعي
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    const url = r.result as string;
                    setActive({ id: `ref-${Date.now()}`, name: "تصميم مرجعي", url, opacity: 0.9 });
                    setBox(resetBox());
                    toast.success("تم اعتماد التصميم — اسحبه واضبطه فوق الجدار");
                  };
                  r.readAsDataURL(f);
                }} />
              </label>
            </div>
            <p className="mb-2 text-[10px] text-muted-foreground">تلميح: اسحب أي تصميم بالماوس وأفلته فوق الجدار ✨</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {allLayers.map((l) => (
                <button key={l.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-watar-layer", JSON.stringify(l));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => { setActive(l); setBox(resetBox()); setAiResult(null); }}
                  className={`group cursor-grab active:cursor-grabbing overflow-hidden rounded-xl border-2 transition ${active?.id === l.id ? "border-primary shadow-soft" : "border-border hover:border-primary/50 hover:-translate-y-0.5"}`}>
                  <img src={l.url} alt={l.name} className="h-16 w-full object-cover" draggable={false} />
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
                <label className="block">
                  <span className="text-[11px] font-bold text-muted-foreground">المسافة (كم)</span>
                  <input type="number" min={0} value={km} onChange={(e) => setKm(+e.target.value)}
                    className="mt-1 w-full rounded-lg bg-muted px-2 py-2 text-sm" />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-4 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-90">الإجمالي المقدّر</p>
              {enabledCurs.length > 1 && (
                <div className="inline-flex rounded-lg bg-background/15 p-0.5 text-[11px] font-black backdrop-blur">
                  {enabledCurs.map((c) => (
                    <button key={c.code} onClick={() => setCurrencyMode(c.code)}
                      className={`px-2.5 py-1 rounded-md transition ${currencyMode === c.code ? "bg-background text-foreground" : "text-primary-foreground/80"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-3xl font-black">{grandTotal.toLocaleString("ar", { maximumFractionDigits: 0 })} {currency}</p>
            <p className="mt-1 text-[11px] opacity-80">
              طباعة: {baseTotal.toLocaleString("ar", { maximumFractionDigits: 0 })} + شحن: {shippingCost.toLocaleString("ar", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10">
        <details className="group rounded-2xl border border-dashed border-border bg-card/50 p-3">
          <summary className="cursor-pointer list-none text-xs font-black text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Wand2 className="size-3.5 text-primary" />
              استوديو التوليد التخيلي لأفكار تصاميم جديدة
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px]">إلهام</span>
            </span>
          </summary>
          <div className="mt-3">
            <AiImageStudio
              section="simulator"
              title="استوديو التوليد التخيلي للجدران"
              subtitle="استلهم أفكار تصاميم جديدة — ثم اعتمدها ودمجها بالأعلى على جدارك الحقيقي."
              accent="from-primary to-accent"
              basePrompt="High-resolution interior wall/floor decorative design, photorealistic, premium material finish"
              buildPrompt={({ basePrompt, presetPrompt, prompt }) => [
                basePrompt, presetPrompt,
                `Target surface: ${surface}.`,
                "Generate only the decorative pattern element, tileable, sharp and print-ready.",
                prompt,
              ].filter(Boolean).join(" ")}
              presets={[
                { id: "rose", label: "حديقة ورود", prompt: "soft pink rose garden mural, romantic warm lighting" },
                { id: "calli", label: "خط عربي ذهبي", prompt: "elegant golden arabic calligraphy on dark marble" },
                { id: "marble", label: "رخام فاخر", prompt: "luxurious veined marble texture, ivory and gold" },
                { id: "3d", label: "كسر 3D", prompt: "dramatic 3D broken wall illusion, depth, cinematic" },
              ]}
            />
          </div>
        </details>
      </div>

      {/* Bottom action sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <button onClick={runAiProjection} disabled={aiBusy || !bg || !active}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-3 py-3 text-xs font-black text-primary-foreground shadow-soft disabled:opacity-50">
            {aiBusy ? <><Loader2 className="size-4 animate-spin" /> جارٍ الدمج…</> : <><Wand2 className="size-4" /> ادمج بواقعية AI</>}
          </button>
          {aiResult && (
            <>
              <button onClick={() => setPostEdit((v) => !v)}
                title="أعد تمديد/تقليص التصميم فوق نتيجة الدمج"
                className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-black shadow-soft ${
                  postEdit ? "bg-primary text-primary-foreground" : "border border-primary/40 bg-primary/10 text-primary"
                }`}>
                <Sliders className="size-4" /> {postEdit ? "إنهاء التعديل" : "تمديد/تقليص"}
              </button>
              <button onClick={() => { setAiResult(null); setPostEdit(false); }}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-3 text-xs font-black text-foreground">
                <RotateCcw className="size-4" /> رجوع للتحرير
              </button>
            </>
          )}

          <button onClick={downloadResult} disabled={!aiResult}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-3 text-xs font-black text-foreground disabled:opacity-40">
            <Download className="size-4" /> حفظ
          </button>
          <button onClick={sendOrder} disabled={sending || !regionId}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-3 py-3 text-xs font-black text-background disabled:opacity-40">
            <ShoppingBag className="size-4" /> طلب
          </button>
        </div>
      </div>

      {/* Live camera modal */}
      {camOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" dir="rtl">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-black">
            <video ref={videoRef} playsInline muted className="block max-h-[70vh] w-full bg-black object-contain" />
            <div className="flex items-center justify-between gap-2 bg-black/80 p-3">
              <button onClick={closeCamera} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">إلغاء</button>
              <button onClick={snapPhoto}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-6 py-3 text-sm font-black text-primary-foreground shadow-soft">
                <Camera className="size-4" /> التقاط
              </button>
              <span className="w-16" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label, value, min, max, step, onChange, fmt,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-primary"
      />
    </label>
  );
}

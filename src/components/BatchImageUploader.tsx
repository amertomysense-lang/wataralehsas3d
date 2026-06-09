import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { UploadCloud, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export type BatchItem = { dataUrl: string; name: string; sizeKB: number };

type Props = {
  onUploaded: (items: BatchItem[]) => void | Promise<void>;
  maxFiles?: number;
  maxWidthPx?: number;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
};

/** رفع جماعي ذكي — يدعم حتى 100 صورة، ضغط فوري داخل المتصفح ثم إرجاع dataURLs. */
export function BatchImageUploader({
  onUploaded,
  maxFiles = 100,
  maxWidthPx = 1600,
  maxSizeMB = 0.6,
  label = "اسحب وأفلت أو اختر صور التصاميم",
  hint = "حتى 100 صورة في المرة — يتم ضغطها تلقائياً قبل الحفظ.",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [drag, setDrag] = useState(false);

  async function processFiles(files: File[]) {
    if (!files.length) return;
    if (files.length > maxFiles) {
      toast.error(`الحدّ الأقصى ${maxFiles} صورة في المرة الواحدة`);
      files = files.slice(0, maxFiles);
    }
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const items: BatchItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const compressed = await imageCompression(f, {
          maxSizeMB,
          maxWidthOrHeight: maxWidthPx,
          useWebWorker: true,
          fileType: "image/webp",
          initialQuality: 0.82,
        });
        const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
        items.push({ dataUrl, name: f.name.replace(/\.[^.]+$/, ""), sizeKB: Math.round(compressed.size / 1024) });
      } catch (e) {
        console.error("compress fail", f.name, e);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    try {
      await onUploaded(items);
      toast.success(`تمت معالجة ${items.length} صورة بنجاح`);
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر الحفظ");
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    void processFiles(files);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    void processFiles(files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 transition ${
        drag ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      <div className="flex flex-col items-center text-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          {busy ? <Loader2 className="size-7 animate-spin" /> : <UploadCloud className="size-7" />}
        </div>
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-soft disabled:opacity-50"
        >
          <ImagePlus className="size-4" /> اختر الصور
        </button>
        {busy && (
          <p className="text-[11px] text-muted-foreground">
            جاري الضغط والمعالجة… {progress.done}/{progress.total}
          </p>
        )}
      </div>
    </div>
  );
}

export function PriceOrTrialBadge({ price, currency }: { price: number | null | undefined; currency: string }) {
  if (price != null && Number(price) > 0) {
    return (
      <p className="mt-1 text-sm font-black text-primary">
        {Number(price).toLocaleString("ar")} <span className="text-xs opacity-80">{currency}</span>
      </p>
    );
  }
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
      ✦ للتجربة والمعاينة الافتراضية
    </span>
  );
}

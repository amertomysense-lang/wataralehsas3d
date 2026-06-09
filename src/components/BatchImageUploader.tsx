import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { UploadCloud, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export type BatchItem = { dataUrl: string; name: string };

type Props = {
  onUploaded: (items: BatchItem[]) => Promise<void> | void;
  maxFiles?: number;
  maxWidthPx?: number;
  maxSizeMB?: number;
  hint?: string;
};

/** رفع جماعي مبسّط: اختر صور → ضغط تلقائي → حفظ. لا حقول إجبارية. */
export function BatchImageUploader({
  onUploaded,
  maxFiles = 100,
  maxWidthPx = 1400,
  maxSizeMB = 0.45,
  hint = "اسحب الصور هنا أو اضغط للاختيار — حتى 100 صورة دفعة واحدة.",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [drag, setDrag] = useState(false);

  async function processFiles(files: File[]) {
    if (!files.length) return;
    if (files.length > maxFiles) {
      toast.message(`سيتم رفع أول ${maxFiles} صورة فقط`);
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
          initialQuality: 0.8,
        });
        const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
        items.push({ dataUrl, name: f.name.replace(/\.[^.]+$/, "") });
      } catch (e) {
        console.error("compress fail", f.name, e);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    try {
      // إدخال على دفعات صغيرة لتفادي حدّ الحمولة
      const CHUNK = 10;
      for (let i = 0; i < items.length; i += CHUNK) {
        await onUploaded(items.slice(i, i + CHUNK));
      }
      toast.success(`تم حفظ ${items.length} صورة`);
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر الحفظ");
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        void processFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
      }}
      className={`rounded-2xl border-2 border-dashed p-6 transition ${drag ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => void processFiles(Array.from(e.target.files ?? []))} className="hidden" />
      <div className="flex flex-col items-center text-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          {busy ? <Loader2 className="size-7 animate-spin" /> : <UploadCloud className="size-7" />}
        </div>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-soft disabled:opacity-50">
          <ImagePlus className="size-4" /> اختر الصور
        </button>
        {busy && <p className="text-[11px] text-muted-foreground">جارٍ المعالجة… {progress.done}/{progress.total}</p>}
      </div>
    </div>
  );
}

export function PriceOrTrialBadge({
  price,
  currency,
}: { price: number | null | undefined; currency?: string | null }) {
  if (price != null && Number(price) > 0) {
    return (
      <p className="mt-1 text-sm font-black text-primary">
        {Number(price).toLocaleString("ar")}
        {currency ? <span className="text-xs opacity-80"> {currency}</span> : null}
      </p>
    );
  }
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
      ✦ للتجربة والمعاينة الافتراضية
    </span>
  );
}

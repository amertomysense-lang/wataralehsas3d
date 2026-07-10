import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";

type Props = {
  onImage: (dataUrl: string, file?: File) => void;
  enablePaste?: boolean;
  className?: string;
  children?: ReactNode;
  hint?: string;
};

/**
 * منطقة إفلات ذكية: تدعم السحب من سطح المكتب واللصق من الحافظة (Ctrl+V).
 * تُظهر لوحة توهج ذهبية عند تحويم ملف فوق النافذة.
 */
export function DropZone({ onImage, enablePaste = true, className, children, hint }: Props) {
  const [hover, setHover] = useState(false);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => onImage(r.result as string, file);
    r.readAsDataURL(file);
  }, [onImage]);

  useEffect(() => {
    if (!enablePaste) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) { readFile(f); e.preventDefault(); break; }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enablePaste, readFile]);

  return (
    <div
      className={className}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false);
        const url = e.dataTransfer.getData("text/plain");
        if (url && /^https?:\/\//.test(url)) { onImage(url); return; }
        const f = e.dataTransfer.files?.[0];
        if (f) readFile(f);
      }}
      style={{ position: "relative" }}
    >
      {children}
      {hover && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm animate-in fade-in">
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-lg">
            <Upload className="size-4" /> {hint ?? "أفلت الصورة هنا"}
          </div>
        </div>
      )}
    </div>
  );
}

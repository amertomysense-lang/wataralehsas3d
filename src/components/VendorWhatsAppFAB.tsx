import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";

/**
 * زر واتساب المنتج — يُحقن داخل رصيف الأزرار العائم الموحّد (FloatingDock)
 * عبر Portal إلى العنصر #watar-dock-slot، ليكون متناسقاً بصرياً ولا يتصادم
 * مع بقية الأزرار.
 */
export function VendorWhatsAppFAB({
  phone, vendorName, productTitle,
}: { phone?: string | null; vendorName?: string | null; productTitle?: string | null }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const find = () => {
      const el = document.getElementById("watar-dock-slot");
      if (el) { setSlot(el); return true; }
      return false;
    };
    if (find()) return;
    const t = setInterval(() => { if (find()) clearInterval(t); }, 100);
    return () => clearInterval(t);
  }, []);

  if (!phone || !slot) return null;
  const clean = phone.replace(/\D/g, "");
  const msg = `مرحباً ${vendorName ?? ""}، لقد قمت بمعاينة منتجكم ${productTitle ?? ""} عبر منصة وتر الإحساس وأود استكمال الحجز والتنفيذ معكم.`;
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;

  return createPortal(
    <a
      href={url} target="_blank" rel="noreferrer"
      aria-label={`تواصل مع ${vendorName ?? "التاجر"}`}
      title={`تواصل مع ${vendorName ?? "التاجر"}`}
      className="group relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-green-600 to-green-500 text-white shadow-xl ring-2 ring-background transition hover:scale-110 active:scale-95"
    >
      <MessageCircle className="size-5" />
      <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[10px] font-black text-background opacity-0 shadow transition group-hover:opacity-100">
        تواصل مع {vendorName ?? "التاجر"}
      </span>
    </a>,
    slot,
  );
}

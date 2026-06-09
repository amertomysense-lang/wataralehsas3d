import { MessageCircle } from "lucide-react";

// زر عائم أنيق للتواصل المباشر مع التاجر — يفتح واتساب برسالة عربية جاهزة
export function VendorWhatsAppFAB({
  phone, vendorName, productTitle,
}: { phone?: string | null; vendorName?: string | null; productTitle?: string | null }) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, "");
  const msg = `مرحباً ${vendorName ?? ""}، لقد قمت بمعاينة منتجكم ${productTitle ?? ""} عبر منصة وتر الإحساس وأود استكمال الحجز والتنفيذ معكم.`;
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  return (
    <a
      href={url} target="_blank" rel="noreferrer"
      aria-label="تواصل مباشر مع التاجر"
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-green-600 to-green-500 px-5 py-3.5 text-sm font-black text-white shadow-2xl ring-4 ring-green-500/20 transition hover:scale-105 active:scale-95"
      dir="rtl"
    >
      <MessageCircle className="size-5" />
      تواصل مع {vendorName ?? "التاجر"}
    </a>
  );
}

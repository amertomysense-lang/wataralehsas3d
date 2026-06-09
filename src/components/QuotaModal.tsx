import { X, Crown } from "lucide-react";
import { QUOTA_EXCEEDED_MSG } from "@/lib/quota";

export function QuotaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-4" dir="rtl" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-2xl">
        <button onClick={onClose} className="absolute left-3 top-3 rounded-full p-1.5 hover:bg-muted">
          <X className="size-5" />
        </button>
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow">
          <Crown className="size-8 text-primary-foreground" />
        </div>
        <h3 className="mt-4 text-center text-xl font-black">انتهت محاولاتك المجانية</h3>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{QUOTA_EXCEEDED_MSG}</p>
        <button onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
          حسناً
        </button>
      </div>
    </div>
  );
}

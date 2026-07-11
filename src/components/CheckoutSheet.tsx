import { useState } from "react";
import { X, Truck, Wallet, CheckCircle2, Copy, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCloudSettings } from "@/lib/cloud-settings";

export type CheckoutPayload = {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  surface_status: "ready" | "needs_prep";
  payment_method: "cod" | "sham_cash";
};

export function CheckoutSheet({
  open,
  onClose,
  onConfirm,
  totalLabel,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (p: CheckoutPayload) => Promise<void> | void;
  totalLabel: string;
  submitting?: boolean;
}) {
  const { data: cs, isLoading } = useCloudSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [surface, setSurface] = useState<"ready" | "needs_prep">("ready");
  const [payment, setPayment] = useState<"cod" | "sham_cash">("cod");

  if (!open) return null;

  function copy(v: string) {
    navigator.clipboard.writeText(v);
    toast.success("تم النسخ");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("الاسم مطلوب");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 7) return toast.error("رقم الهاتف غير صحيح");
    if (!address.trim()) return toast.error("العنوان مطلوب");
    await onConfirm({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim(),
      surface_status: surface,
      payment_method: payment,
    });
  }

  const wa = cs?.contact_whatsapp || "963933000000";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end sm:place-items-center bg-black/70 p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl border border-border"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-5 py-3">
          <h3 className="text-sm font-black">إتمام الطلب</h3>
          <button type="button" onClick={onClose} className="rounded-full bg-muted p-1.5"><X className="size-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          {/* Customer info */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-muted-foreground">الاسم</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground">رقم الهاتف</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                inputMode="tel" placeholder="09XXXXXXXX"
                className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground">المبلغ الإجمالي</label>
              <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-black text-primary">{totalLabel}</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-muted-foreground">العنوان التفصيلي</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)}
              rows={2} placeholder="المدينة، الحي، أقرب معلم…"
              className="w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Surface toggle */}
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="mb-2 text-[11px] font-black text-muted-foreground">حالة السطح</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { k: "ready", label: "جاهز/مبيض", desc: "لا يحتاج تحضير" },
                { k: "needs_prep", label: "يحتاج تحضير", desc: "معالجة قبل الطباعة" },
              ] as const).map((o) => (
                <button key={o.k} type="button" onClick={() => setSurface(o.k)}
                  className={`rounded-xl border p-2.5 text-right transition ${
                    surface === o.k ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  }`}>
                  <p className="text-xs font-black">{o.label}</p>
                  <p className="text-[10px] text-muted-foreground">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="mb-2 text-[11px] font-black text-muted-foreground">طريقة الدفع</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPayment("cod")}
                className={`inline-flex items-center gap-2 rounded-xl border p-2.5 text-xs font-black transition ${
                  payment === "cod" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"
                }`}>
                <Truck className="size-4" /> دفع عند التسليم
              </button>
              <button type="button" onClick={() => setPayment("sham_cash")}
                className={`inline-flex items-center gap-2 rounded-xl border p-2.5 text-xs font-black transition ${
                  payment === "sham_cash" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"
                }`}>
                <Wallet className="size-4" /> شام كاش
              </button>
            </div>

            {payment === "sham_cash" && (
              <div className="mt-3 space-y-2 rounded-xl bg-muted/40 p-3">
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="mx-auto h-40 w-40 rounded-xl bg-muted" />
                    <div className="mx-auto h-3 w-32 rounded bg-muted" />
                  </div>
                ) : (
                  <>
                    {cs?.sham_cash_qr_url ? (
                      <img src={cs.sham_cash_qr_url} alt="QR شام كاش"
                        className="mx-auto h-44 w-44 rounded-xl bg-white object-contain shadow-inner" />
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground">
                        لم يتم رفع QR بعد — تواصل معنا عبر واتساب لإتمام الدفع.
                      </p>
                    )}
                    {cs?.sham_cash_number && (
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{cs.sham_cash_number}</p>
                          {cs.sham_cash_name && <p className="text-[10px] text-muted-foreground">{cs.sham_cash_name}</p>}
                        </div>
                        <button type="button" onClick={() => copy(cs.sham_cash_number!)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-black text-primary-foreground">
                          <Copy className="size-3" /> نسخ
                        </button>
                      </div>
                    )}
                    {cs?.sham_cash_notes && (
                      <p className="rounded-lg bg-accent/10 px-3 py-2 text-[11px] leading-relaxed text-accent">{cs.sham_cash_notes}</p>
                    )}
                    <a href={`https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent("أرغب بتأكيد دفع طلبي عبر شام كاش")}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">
                      <MessageCircle className="size-4" /> تأكيد الدفع عبر واتساب
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {submitting ? "جاري الإرسال…" : "تأكيد الطلب"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Info, Layers, Move, Wand2, Shield } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

/**
 * رصيف عائم موحّد لأزرار المساعد والمزايا والواتساب.
 * يوفّر ترتيباً عمودياً ثابتاً في الزاوية السفلى اليسرى بحيث لا تتصادم الأزرار ولا تغطّي محتوى.
 * زر الواتساب اختياري ويُفعّل عبر <FloatingDockSlot /> (Portal) من صفحة المنتج.
 */

type Msg = { role: "user" | "assistant"; content: string };

export function FloatingDock() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // إخفاء المساعد داخل صفحة المنتج (لها محادثتها الخاصة)
  const hideChat = location.pathname.startsWith("/product/");

  return (
    <>
      {/* الرصيف: عمود ثابت أسفل يسار الشاشة */}
      <div
        dir="rtl"
        className="fixed left-3 z-30 flex flex-col items-center gap-2.5"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        {/* منفذ لأزرار سياقية (واتساب المنتج) */}
        <div id="watar-dock-slot" className="flex flex-col items-center gap-2.5" />

        <DockButton
          label="مزايا المشروع"
          tone="accent"
          onClick={() => setInfoOpen(true)}
        >
          <Info className="size-4" />
        </DockButton>

        {!hideChat && (
          <DockButton
            label="اسأل المساعد"
            tone="primary"
            onClick={() => setChatOpen(true)}
            pulse
          >
            <MessageCircle className="size-5" />
          </DockButton>
        )}
      </div>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      {infoOpen && <FeaturesPanel onClose={() => setInfoOpen(false)} />}
    </>
  );
}

function DockButton({
  children, label, onClick, tone, pulse,
}: {
  children: React.ReactNode; label: string; onClick: () => void;
  tone: "primary" | "accent" | "success"; pulse?: boolean;
}) {
  const bg =
    tone === "primary" ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
    : tone === "success" ? "bg-gradient-to-br from-green-600 to-green-500 text-white"
    : "bg-card text-foreground border border-border";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`group relative grid size-11 place-items-center rounded-full shadow-xl ring-2 ring-background transition hover:scale-110 active:scale-95 ${bg} ${pulse ? "animate-float" : ""}`}
    >
      {children}
      <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[10px] font-black text-background opacity-0 shadow transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

/* ================= Chat panel ================= */

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "مرحباً! أنا مساعد وتر الإحساس. اسألني عن أي تصميم أو خدمة طباعة جدارية وسأجيبك بناءً على معلومات المنتجات والأسعار لدينا." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("ضغط مرتفع، حاول بعد قليل");
        if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي مستهلك");
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { text: string };
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "تعذّر الاتصال";
      setMessages([...next, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start bg-black/40 backdrop-blur-sm sm:p-5" dir="rtl" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="flex h-[85vh] w-full flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:h-[600px] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
            <div>
              <p className="text-sm font-bold">مساعد وتر الإحساس</p>
              <p className="text-[11px] text-muted-foreground">يجيب عن المنتجات والأسعار فقط</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end"><div className="rounded-2xl bg-muted px-3 py-2"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div></div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="اكتب سؤالك..." className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={send} disabled={loading || !input.trim()}
            className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"><Send className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}

/* ================= Features panel ================= */

function FeaturesPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in" dir="rtl" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-3 left-3 rounded-full p-1.5 hover:bg-muted"><X className="size-4" /></button>
        <div className="mb-1 inline-flex items-center gap-2 text-xs font-black text-primary"><Sparkles className="size-3.5" /> وتر الإحساس</div>
        <h2 className="text-lg font-black leading-tight">محاكي دمج التصاميم على الجدران والأرضيات</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          ارفع صورة مكانك أو التقطها، حدّد نطاق الجدار بالنقر على أطرافه، اختر تصميماً، ثم
          <b className="text-foreground"> اسحبه وحرّكه وكبّره وأدره </b>
          داخل النطاق فقط — مع تأثيرات احترافية للحصول على شكل نهائي دقيق قبل الطباعة.
        </p>
        <div className="mt-4 space-y-3 text-[12px] leading-relaxed">
          <Item icon={Move} title="تحديد نطاق الجدار بدقّة">
            انقر على أطراف الجدار في الصورة لرسم نطاقه، والتصميم يظهر داخله فقط — دون تجاوز الأثاث أو النوافذ.
          </Item>
          <Item icon={Layers} title="تأثيرات احترافية">
            شفافية، طمس، إشراق، تشبع، تباين، ووضع مزج لدمج التصميم بنسيج الجدار كأنه مطبوع فعلاً.
          </Item>
          <Item icon={Wand2} title="دمج واقعي بالذكاء الاصطناعي">
            زر واحد يُعيد إسقاط التصميم بمنظور حقيقي مع مطابقة الإضاءة والظلال — جودة 8K جاهزة للطباعة UV.
          </Item>
        </div>
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-[11px] leading-relaxed text-primary">
          <b>طباعة UV احترافية:</b> بعد اعتماد التصميم تُنفَّذ الطباعة بدقة 8K مع خيار البروز الملموس Embossed وحساب فوري للسعر والشحن حسب منطقتك.
        </div>
      </div>
    </div>
  );
}

function Item({ icon: Icon, title, children }: { icon: typeof Layers; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="mb-1 flex items-center gap-2 text-[12px] font-black"><Icon className="size-3.5 text-primary" /> {title}</div>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

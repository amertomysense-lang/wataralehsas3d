import { useEffect, useRef, useState } from "react";
import {
  MessageCircle, X, Send, Loader2, Sparkles, Info, Layers, Move, Wand2, Shield,
  Home, Images, Wand2 as WandNav, Settings, RefreshCw, Upload,
} from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

/**
 * دوك سفلي احترافي موحّد لكل التطبيق:
 * - شريط تنقّل رئيسي (الرئيسية · المعرض · المحاكي · الحاسبة) بتصميم بيضاوي أخضر.
 * - صف أدوات سريعة فوقه (محادثة · مزايا · تحديث · لوحة تحكم للأدمن).
 * يحافظ على نفس المزايا الموجودة سابقاً (المحادثة، فقاعة المزايا، الوصول للوحة التحكم).
 */

type Msg = { role: "user" | "assistant"; content: string };

type NavItem = { key: string; label: string; icon: typeof Home; to: string; hash?: string; match: (p: string) => boolean };

const NAV: NavItem[] = [
  { key: "home", label: "الرئيسية", icon: Home, to: "/", match: (p) => p === "/" },
  { key: "gallery", label: "المعرض", icon: Images, to: "/gallery", match: (p) => p.startsWith("/gallery") },
  { key: "sim", label: "المحاكي", icon: WandNav, to: "/simulator", match: (p) => p.startsWith("/simulator") },
  { key: "settings", label: "الإعدادات", icon: Settings, to: "/admin", match: (p) => p.startsWith("/admin") },
];

export function FloatingDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const hideChat = location.pathname.startsWith("/product/");
  const hideAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/bulk-upload");
  // نُخفي الدوك في صفحات لها شريط سفلي خاص بها (المحاكي/الأدمن/الرفع الجماعي)
  // لتفادي تراكب أزرار الإجراءات فوق بعضها البعض.
  const hide =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/bulk-upload") ||
    location.pathname.startsWith("/simulator");

  if (hide) return null;

  return (
    <>
      {/* منطقة الأدوات + شريط التنقّل — ثابتة أسفل الشاشة */}
      <div
        dir="rtl"
        className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-stretch gap-2 px-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        {/* صف الأدوات السريعة */}
        <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="flex h-11 flex-1 items-center justify-between gap-2 rounded-full border border-primary/15 bg-card/95 px-4 shadow-lg backdrop-blur-lg transition active:scale-[0.98]"
            aria-label="محادثة"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-primary">
              <MessageCircle className="size-4" /> محادثة
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-3.5" />
            </span>
          </button>

          <button
            onClick={() => setInfoOpen(true)}
            aria-label="مزايا المشروع"
            title="مزايا المشروع"
            className="grid size-11 place-items-center rounded-full border border-primary/15 bg-card/95 text-primary shadow-lg backdrop-blur-lg transition active:scale-95"
          >
            <Info className="size-4" />
          </button>

          <button
            onClick={() => window.location.reload()}
            aria-label="تحديث"
            title="تحديث الصفحة"
            className="grid size-11 place-items-center rounded-full border border-primary/15 bg-card/95 text-primary shadow-lg backdrop-blur-lg transition active:scale-95"
          >
            <RefreshCw className="size-4" />
          </button>

          {!hideAdmin && (
            <button
              onClick={() => navigate({ to: "/admin" })}
              aria-label="لوحة التحكم"
              title="لوحة التحكم"
              className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-95"
            >
              <Shield className="size-4" />
            </button>
          )}
        </div>

        {/* منفذ لأزرار سياقية (واتساب المنتج) */}
        <div id="watar-dock-slot" className="pointer-events-auto mx-auto flex w-full max-w-md flex-wrap items-center justify-center gap-2 empty:hidden" />

        {/* شريط التنقّل الرئيسي — بيضاوي أخضر */}
        <nav className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-1 rounded-[28px] border border-white/5 bg-primary p-1.5 shadow-2xl shadow-primary/30">
          {NAV.map((item) => {
            const active = item.match(location.pathname);
            return (
              <button
                key={item.key}
                onClick={() => navigate({ to: item.to, hash: item.hash })}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] py-2.5 transition ${
                  active
                    ? "bg-[color-mix(in_oklab,var(--accent)_92%,white)] text-primary shadow-md"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`}
              >
                <item.icon className="size-[18px]" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {chatOpen && !hideChat && <ChatPanel onClose={() => setChatOpen(false)} />}
      {infoOpen && <FeaturesPanel onClose={() => setInfoOpen(false)} />}
    </>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:p-5" dir="rtl" onClick={onClose}>
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

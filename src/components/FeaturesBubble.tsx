import { useState } from "react";
import { Info, X, Layers, Sparkles, Move, Wand2 } from "lucide-react";

/**
 * فقاعة موحّدة تشرح مزايا مشروع "وتر الإحساس" لدمج تصاميم الديكور
 * (جدران / أرضيات / أسقف) بالسحب والإفلات والتأثيرات + دمج AI واقعي اختياري.
 */
export function FeaturesBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="مزايا وتر الإحساس"
        className="fixed left-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-primary to-primary-glow px-3.5 py-2 text-[11px] font-black text-primary-foreground shadow-2xl ring-2 ring-background transition hover:scale-105"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 10rem)" }}
        dir="rtl"
      >
        <Info className="size-3.5" /> مزايا المشروع
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setOpen(false)}
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 left-3 rounded-full p-1.5 hover:bg-muted"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>

            <div className="mb-1 inline-flex items-center gap-2 text-xs font-black text-primary">
              <Sparkles className="size-3.5" /> وتر الإحساس
            </div>
            <h2 className="text-lg font-black leading-tight">
              محاكي دمج التصاميم على الجدران والأرضيات
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              ارفع صورة مكانك أو التقطها مباشرة، اختر تصميماً، ثم
              <b className="text-foreground"> اسحبه وحرّكه وكبّره وأدره </b>
              فوق الجدار بدقة — مع تأثيرات احترافية لضبط شكله النهائي قبل الطباعة.
            </p>

            <div className="mt-4 space-y-3 text-[12px] leading-relaxed">
              <Item icon={Move} title="سحب وإفلات وتحكّم كامل بالمقاس">
                حرّك التصميم أينما تريد على الجدار، غيّر حجمه من الزاوية،
                ودوّره من المقبض العلوي لضبط الاتجاه المثالي.
              </Item>
              <Item icon={Layers} title="تأثيرات احترافية على التصميم">
                شفافية، طمس، إشراق، تشبع، تباين، ووضع مزج (Blend Mode)
                لدمج التصميم بنسيج الجدار كأنه مطبوع فعلاً.
              </Item>
              <Item icon={Wand2} title="دمج واقعي بالذكاء الاصطناعي (اختياري)">
                زر واحد يُعيد إسقاط التصميم بمنظور حقيقي مع مطابقة الإضاءة والظلال —
                جودة 8K جاهزة للطباعة UV.
              </Item>
            </div>

            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-[11px] leading-relaxed text-primary">
              <b>طباعة UV احترافية:</b> بعد اعتماد التصميم تُنفَّذ الطباعة على الجدار
              أو الأرضية أو السقف بدقة 8K مع خيار البروز الملموس (Embossed)
              وحساب فوري للسعر والشحن حسب منطقتك.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Item({ icon: Icon, title, children }: { icon: typeof Layers; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="mb-1 flex items-center gap-2 text-[12px] font-black text-foreground">
        <Icon className="size-3.5 text-primary" /> {title}
      </div>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Wand2, Images, Sparkles, Info, Layers, Move } from "lucide-react";
import { CampaignSection } from "@/components/CampaignSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وتر الإحساس — طباعة الجدران والأرضيات بدقة 8K" },
      { name: "description", content: "منصة سورية رائدة لطباعة الجدران والأرضيات UV بدقة 8K مع محاكي دمج تصاميم فوري." },
      { property: "og:title", content: "وتر الإحساس — طباعة الجدران والأرضيات بدقة 8K" },
      { property: "og:description", content: "دمج تصاميمك على جدرانك بالسحب والإفلات، ثم اطبعها UV بدقة 8K مع البروز الملموس." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background pb-40 overflow-x-hidden" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{
          background:
            "radial-gradient(circle at 10% 0%, oklch(0.78 0.16 75 / 0.25) 0, transparent 55%), radial-gradient(circle at 90% 100%, oklch(0.7 0.14 55 / 0.2) 0, transparent 55%)",
        }} />
        <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
            <Sparkles className="size-3.5" /> وتر الإحساس
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-tight bg-gradient-to-l from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            طباعة الجدران والأرضيات بدقة 8K
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            ارفع صورة جدارك، اسحب تصميمك فوقه بحرّية، ادمجه بواقعية بالذكاء الاصطناعي،
            ثم اطلب الطباعة UV مع البروز الملموس — كل ذلك من مكانك.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-5 py-3 text-sm font-black text-primary-foreground shadow-soft transition hover:scale-[1.02]"
            >
              <Wand2 className="size-4" /> ابدأ محاكاة جدارك الآن
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground"
            >
              <Images className="size-4" /> استعرض المعرض
            </Link>
          </div>
        </div>
      </section>

      {/* Marketing / features */}
      <div className="mx-auto max-w-6xl px-5 pt-2">
        <CampaignSection />
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <h2 className="text-lg sm:text-xl font-black text-foreground">كيف يعمل التطبيق؟</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Step icon={Move} title="١ · ارفع صورة جدارك" desc="من الكاميرا مباشرة أو من معرض جهازك." />
          <Step icon={Layers} title="٢ · اسحب تصميمك فوقه" desc="غيّر الحجم، أدره، اضبط التأثيرات والشفافية." />
          <Step icon={Wand2} title="٣ · ادمج واطلب الطباعة" desc="دمج AI واقعي بدقة 8K ثم طلب مباشر عبر واتساب." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-10 max-w-4xl px-5">
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-black text-primary">
            <Info className="size-3.5" /> جاهز للانطلاق؟
          </div>
          <p className="text-sm sm:text-base font-bold text-foreground">
            جرّب المحاكي مجاناً بدون تسجيل — ستحصل على معاينة واقعية خلال ثوانٍ.
          </p>
          <Link
            to="/simulator"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-soft"
          >
            <Wand2 className="size-4" /> افتح المحاكي
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ icon: Icon, title, desc }: { icon: typeof Move; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

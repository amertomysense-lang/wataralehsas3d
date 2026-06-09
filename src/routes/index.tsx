import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Cuboid, ShoppingBag, Shirt, ArrowLeft, Wifi, ShieldCheck } from "lucide-react";
import { useOnlineSync } from "@/lib/offline-sync";
import { CampaignSection } from "@/components/CampaignSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وتر الإحساس — مستقبل الديكور الرقمي والتجارة الذكية في الشمال" },
      { name: "description", content: "طباعة 8K، تأثيرات بروز 3D ملموسة، وتجربة AI افتراضية للأزياء — منصة موحدة للدانا، سرمدا، إدلب وأرياف حلب." },
      { property: "og:title", content: "وتر الإحساس — مستقبل الديكور الرقمي" },
      { property: "og:description", content: "محاكي جدران وأرضيات + سوق شركاء + غرفة تجربة افتراضية" },
    ],
  }),
  component: Home,
});

function Home() {
  useOnlineSync();
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-60" style={{
          background:
            "radial-gradient(circle at 20% 10%, oklch(0.78 0.16 75 / 0.25) 0, transparent 45%), radial-gradient(circle at 85% 80%, oklch(0.7 0.14 55 / 0.18) 0, transparent 40%)",
        }} />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> وتر الإحساس · النسخة الاحترافية
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight">
            مستقبل الديكور الرقمي
            <br />
            <span className="bg-gradient-to-l from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              والتجارة الذكية في الشمال
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            طباعة جدارية وأرضيات بدقة <b className="text-foreground">8K</b>، تأثيرات بروز ثلاثية الأبعاد ملموسة،
            وغرفة تجربة <b className="text-foreground">AI افتراضية للأزياء</b>. منصة واحدة تخدم
            الدانا، سرمدا، إدلب وأرياف حلب — بتقنية أوفلاين فورية.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/workflow"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-primary-glow px-6 py-4 text-base font-black text-primary-foreground shadow-soft transition hover:scale-[1.03]">
              ابدأ التجربة التفاعلية الآن
              <ArrowLeft className="size-5 transition group-hover:-translate-x-1" />
            </Link>
            <Link to="/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-bold text-foreground/80 transition hover:border-primary/50 hover:text-foreground">
              <ShieldCheck className="size-4" /> لوحة التحكم
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { i: <Cuboid className="size-4" />, t: "محاكي جدران 3D" },
              { i: <ShoppingBag className="size-4" />, t: "سوق شركاء" },
              { i: <Shirt className="size-4" />, t: "تجربة أزياء AI" },
              { i: <Wifi className="size-4" />, t: "يعمل بدون إنترنت" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-xs font-bold text-foreground/85 backdrop-blur">
                <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary">{f.i}</span>
                {f.t}
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12">
        <CampaignSection />
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} وتر الإحساس — الدانا · سرمدا · إدلب
      </footer>
    </div>
  );
}

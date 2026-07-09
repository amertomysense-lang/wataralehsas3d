import { createFileRoute, Link } from "@tanstack/react-router";
import { Cuboid, ArrowLeft, ShieldCheck, Crown, Move, Wand2, Layers } from "lucide-react";
import { useOnlineSync } from "@/lib/offline-sync";

const GOLD = "#B8893A";
const GOLD_SOFT = "#E8D5A8";
const CHARCOAL = "#1A1A1A";
const CHARCOAL_SOFT = "#5C5C5C";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وتر الإحساس — محاكي دمج تصاميم الجدران والأرضيات" },
      { name: "description", content: "ارفع صورة جدارك أو أرضيتك، اسحب التصميم وحدّد مقاسه ومكانه، وادمجه بواقعية قبل الطباعة." },
      { property: "og:title", content: "وتر الإحساس — محاكي الديكور الفاخر" },
      { property: "og:description", content: "دمج تصاميم الديكور على الجدران والأرضيات بالسحب والإفلات + تأثيرات + AI اختياري." },
    ],
  }),
  component: Home,
});

function Home() {
  useOnlineSync();

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#FFFFFF", color: CHARCOAL }}>
      <header style={{ borderBottom: `1px solid ${GOLD_SOFT}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="inline-flex items-center gap-2">
            <span
              className="grid size-9 place-items-center rounded-xl font-black"
              style={{ background: "#FFFFFF", color: GOLD, border: `1px solid ${GOLD_SOFT}` }}
            >و</span>
            <span className="font-black tracking-tight">وتر الإحساس</span>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold"
            style={{ border: `1px solid ${GOLD_SOFT}`, color: CHARCOAL }}
          >
            <ShieldCheck className="size-3.5" style={{ color: GOLD }} /> لوحة الإدارة
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-8 sm:pt-20">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ background: "#FBF6EC", color: GOLD, border: `1px solid ${GOLD_SOFT}` }}
        >
          <Crown className="size-3" /> محاكي ديكور فاخر
        </span>
        <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          صمّم جدارك،
          <br />
          <span style={{ color: GOLD }}>وشاهده قبل أن يُطبع.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm sm:text-base" style={{ color: CHARCOAL_SOFT }}>
          ارفع صورة الجدار أو الأرضية، اسحب التصميم وحدّد مقاسه ومكانه بدقة،
          وأضف تأثيرات احترافية — ثم ادمجه بواقعية بالذكاء الاصطناعي.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: GOLD, color: "#FFFFFF", boxShadow: "0 10px 24px -10px rgba(184,137,58,0.55)" }}
          >
            <Cuboid className="size-4" /> افتح محاكي الديكور <ArrowLeft className="size-4" />
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black"
            style={{ border: `1px solid ${GOLD_SOFT}`, color: CHARCOAL }}
          >
            سوق شركاء الديكور
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-4">
        <div className="grid gap-5 sm:grid-cols-3">
          <Feature icon={Move} title="سحب • تكبير • تدوير" body="حرّك التصميم بحرية، غيّر حجمه، ودوّره لضبط الاتجاه المثالي على الجدار." />
          <Feature icon={Layers} title="تأثيرات احترافية" body="شفافية، طمس، إشراق، تشبع، تباين، ووضع مزج لدمج بصري متقن قبل الطباعة." />
          <Feature icon={Wand2} title="دمج AI واقعي" body="زر واحد لإسقاط التصميم بمنظور حقيقي مع مطابقة الإضاءة والظلال بدقة 8K." />
        </div>
      </section>

      <footer className="py-6 text-center text-xs" style={{ borderTop: `1px solid ${GOLD_SOFT}`, color: CHARCOAL_SOFT }}>
        © {new Date().getFullYear()} وتر الإحساس — كل الحقوق محفوظة
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Move; title: string; body: string }) {
  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: "#FFFFFF", border: `1px solid ${GOLD_SOFT}`, boxShadow: "0 1px 2px rgba(26,26,26,0.04)" }}
    >
      <div
        className="grid size-12 place-items-center rounded-2xl"
        style={{ background: "#FBF6EC", color: GOLD, border: `1px solid ${GOLD_SOFT}` }}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-black" style={{ color: CHARCOAL }}>{title}</h3>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: CHARCOAL_SOFT }}>{body}</p>
    </div>
  );
}

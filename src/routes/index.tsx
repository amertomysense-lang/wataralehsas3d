import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/simulator" });
  },
  head: () => ({
    meta: [
      { title: "وتر الإحساس — محاكي دمج تصاميم الجدران والأرضيات" },
      { name: "description", content: "ارفع صورة جدارك أو أرضيتك، اسحب التصميم وحدّد مقاسه ومكانه، وادمجه بواقعية قبل الطباعة." },
    ],
  }),
  component: () => null,
});

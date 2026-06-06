import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAI } from "@/lib/ai-gateway.server";
import { supabase } from "@/integrations/supabase/client";

type ChatBody = {
  messages: { role: "user" | "assistant"; content: string }[];
  productContext?: {
    name: string;
    description: string | null;
    category: string | null;
    price: number | null;
  };
};

async function fetchAllProducts() {
  // Server-side fetch using publishable key — read-only public designs
  const { data } = await supabase
    .from("designs")
    .select("name, description, category, price")
    .limit(100);
  return data ?? [];
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChatBody;
          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response("messages required", { status: 400 });
          }

          let knowledge = "";
          if (body.productContext) {
            const p = body.productContext;
            knowledge = `معلومات المنتج المسؤول عنه فقط:
- الاسم: ${p.name}
- الفئة: ${p.category ?? "غير محددة"}
- الوصف: ${p.description ?? "لا يوجد وصف"}
- السعر: ${p.price != null ? `${p.price} ل.س` : "غير محدد — اطلب التواصل لمعرفته"}`;
          } else {
            const products = await fetchAllProducts();
            knowledge =
              products.length === 0
                ? "لا توجد منتجات حالياً في المعرض."
                : "المنتجات المتاحة في المعرض:\n" +
                  products
                    .map(
                      (p, i) =>
                        `${i + 1}. ${p.name}${p.category ? ` — [${p.category}]` : ""}${
                          p.price != null ? ` — السعر: ${p.price} ل.س` : ""
                        }${p.description ? `\n   ${p.description}` : ""}`
                    )
                    .join("\n");
          }

          const system = `أنت مساعد منصة "وتر الإحساس" لخدمة طباعة الجدران ثلاثية الأبعاد.

قواعد صارمة لا تكسرها أبداً:
1. تجيب فقط عن المنتجات والأسعار والمعلومات الموجودة في "قاعدة المعرفة" أدناه.
2. إذا سُئلت عن أي شيء خارج هذا النطاق (طقس، سياسة، برمجة، نصائح عامة، أي علامة تجارية أخرى، الآلات المستخدمة، الورشة، أسرار العمل) ترفض بأدب وتوجه السؤال للمنتجات.
3. لا تخترع أسعاراً أو منتجات غير موجودة. إذا لم تجد المعلومة قل: "هذه المعلومة غير متاحة لدي حالياً، يمكنك التواصل مع الفرع".
4. لا تكشف عن أي تفاصيل تقنية عن آلات الطباعة، الموردين، الموظفين، أو العمليات الداخلية.
5. اللغة العربية الفصحى البسيطة. ردود قصيرة ومباشرة (3-4 أسطر كحد أقصى).
6. كن ودوداً ومحترفاً.

قاعدة المعرفة:
${knowledge}`;

          const ai = createLovableAI();
          const { text } = await generateText({
            model: ai("google/gemini-3-flash-preview"),
            system,
            messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
          });

          return Response.json({ text });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "internal error";
          console.error("/api/chat error:", msg);
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});

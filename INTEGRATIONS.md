# وتر الإحساس — دليل الربط والتكامل الفني الكامل

> هذا الملف مرجع شامل للمختص/المطور المسؤول عن استكمال المشروع.
> يشرح كل خدمة خارجية مربوطة أو تلزم للربط، مع مسارات الكود المتأثرة والمفاتيح المطلوبة.

---

## 1) نظرة عامة على المشروع

- **الاسم التجاري:** وتر الإحساس (Watar Al-Ihsas)
- **الوظيفة:** محاكي ديكور جدران/أرضيات — يرفع الزبون صورة الغرفة، يختار تصميماً من المكتبة أو يرفع تصميمه، ثم يسحب ويلصق ويتحكم بالمقاس/الدوران/المزج مع مطابقة الإضاءة، ويحفظ المشروع سحابياً أو يشاركه بالمعرض العام أو يرسله كطلب.
- **إطار العمل:** TanStack Start (v1) + Vite 7 + React 19 + Tailwind v4 + TypeScript صارم.
- **الاستضافة:** Cloudflare Workers (عبر `wrangler.jsonc`) + بديل Netlify (`netlify.toml`).
- **الحالة:** جاهز للنشر — يحتاج فقط تفعيل المفاتيح أدناه.

---

## 2) خريطة الملفات الأساسية

| المجال | الملفات |
|---|---|
| المسارات (Routes) | `src/routes/__root.tsx`, `index.tsx`, `simulator.tsx`, `gallery.tsx`, `admin.tsx`, `assistant.tsx`, `bulk-upload-studio.tsx`, `marketing-tool.tsx` |
| API خلفية | `src/routes/api/ai-image.ts`, `chat.ts`, `decor-project.ts`, `remove-bg.ts` |
| Server helpers | `src/lib/ai-gateway.server.ts`, `ai-image-edit.server.ts`, `hf-fallback.server.ts`, `config.server.ts` |
| مكونات UI رئيسية | `PerspectiveWarpStage.tsx`, `DraggableDesignLayer.tsx`, `BeforeAfterSlider.tsx`, `DropZone.tsx`, `FloatingDock.tsx`, `FeaturesBubble.tsx`, `KanbanBoard.tsx`, `AdminAnalytics.tsx`, `NewOrdersBell.tsx` |
| إدارة الحالة | `src/lib/platform.ts`, `settings.ts`, `projects.ts`, `quota.ts`, `admin-gate.ts`, `site-config.ts` |
| قاعدة البيانات | `supabase-migrations/001..007_*.sql` |
| بنية تحتية | `src/server.ts`, `src/start.ts`, `src/router.tsx`, `vite.config.ts`, `wrangler.jsonc` |

---

## 3) الربط مع Supabase (Lovable Cloud)

**الحالة:** مربوط جزئياً — العميل موجود، تلزم مراجعة تشغيل الترحيلات.

### المفاتيح
- ملف: `src/integrations/supabase/client.ts`
- `SUPABASE_URL = https://igloimjmnflsghqhumvz.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY = sb_publishable_RWZhaXRJE5gAvZhYU2G_Bw_GHha2Owk` (آمن للواجهة)

### الترحيلات المطلوب تنفيذها بالترتيب
شغّلها في **SQL Editor** داخل لوحة Supabase بالتسلسل:

1. `supabase-migrations/005_reset_schema.sql` — إعادة تهيئة كاملة (regions, products, orders, ...) + دعم عملتين `price_usd` و `price_try` + RLS لكل من anon/authenticated.
2. `006_design_layers_bucket.sql` — إنشاء Bucket `design-layers` في Storage لرفع مكتبة التصاميم (حتى 500 صورة/جلسة).
3. `007_saved_projects.sql` — جدول `saved_projects` لحفظ مشاريع الزبون سحابياً + معرض عام. يعتمد RLS على ترويسة `x-device-id` (تُحقن تلقائياً من `src/lib/projects.ts`).

### الجداول الأساسية
| جدول | الغرض | ملف الوصول |
|---|---|---|
| `regions` | مناطق التوصيل والأسعار | `src/lib/platform.ts` |
| `products` | كتالوج المنتجات | `src/lib/platform.ts` |
| `orders` | الطلبات (مع status لـ Kanban) | `src/components/KanbanBoard.tsx`, `AdminAnalytics.tsx` |
| `designs` | مكتبة التصاميم الجاهزة | `bulk-upload-studio.tsx` |
| `saved_projects` | مشاريع الزبون + معرض | `src/lib/projects.ts`, `src/routes/gallery.tsx` |

### Storage Buckets
- `design-layers` — يخزّن تصاميم مكتبة الشركة بصيغة WebP Q92.
- (اختياري) `room-snapshots` — لرفع نتائج الدمج النهائية.

### Realtime
- مفعّل على جدول `orders` — يستخدمه `src/components/NewOrdersBell.tsx` لتشغيل صوت وإشعار متصفح عند طلب جديد.
- **تلزم مراجعة:** تفعيل Realtime على جدول `orders` من لوحة Supabase → Database → Replication.

---

## 4) الربط مع Lovable AI Gateway (الذكاء الاصطناعي)

**الحالة:** الكود جاهز — يحتاج مفتاح.

### الاستخدام
- **الدمج الواقعي (inpainting)** — الوظيفة الأساسية عبر `src/lib/ai-image-edit.server.ts`.
- **التوليد الإلهامي** — ثانوي عبر `src/lib/ai-gateway.server.ts`.
- **المساعد الذكي** — `src/routes/api/chat.ts`.

### المتغيّرات المطلوبة (ضمن Cloudflare/Netlify env)
```
LOVABLE_API_KEY = <من لوحة Lovable → AI Gateway>
```
يُقرأ داخل `process.env` في الـ handler فقط (وفق قواعد TanStack Start).

---

## 5) Replicate + Hugging Face (بدائل الدمج المتقدّم)

**الحالة:** بنية الكود جاهزة — تحتاج مفاتيح إن رغبت بتفعيلها.

- ملفات: `src/routes/api/ai-image.ts`, `remove-bg.ts`, `src/lib/hf-fallback.server.ts`.
- المتغيّرات:
```
REPLICATE_API_TOKEN = r8_xxx
HF_TOKEN            = hf_xxx
```
- الاستخدام: إزالة الخلفية من التصاميم قبل اللصق، ونماذج Stable Diffusion inpainting كبديل احتياطي.

---

## 6) الدمج المحلي (لا يحتاج انترنت / مجاني)

- **`PerspectiveWarpStage.tsx`** — محرك Warp رباعي الزوايا على HTML5 Canvas: الزبون ينقر 4 نقاط على الجدار في صورته، فيتشوّه التصميم ليطابق المنظور تلقائياً.
- **`DraggableDesignLayer.tsx`** — سحب/تدوير/تكبير/تمديد جانبي/blur/blend-modes + قفل نسبة الأبعاد.
- **مطابقة الإضاءة (`matchLighting`)** داخل `simulator.tsx` — تقرأ متوسط سطوع الجدار وتضبط brightness/saturation للتصميم.
- **Auto-Fit Scan** — يكتشف حدود الجدار تلقائياً عبر تحليل حواف الصورة.

هذا يعني أن التطبيق يعمل بشكل كامل حتى بدون أي مفاتيح AI.

---

## 7) WhatsApp (استلام الطلبات)

- ملفات: `src/components/VendorWhatsAppFAB.tsx`, `src/lib/vendor-config.ts`.
- الإعداد من لوحة الأدمن → الإعدادات → رقم واتساب البائع + قوالب الرسائل.
- يفتح رابط `wa.me/<رقم>?text=<تفاصيل الطلب+رابط الموقع+صورة الدمج>`.

---

## 8) الموقع الجغرافي

- ملف: `src/routes/simulator.tsx` — يستخدم `navigator.geolocation` لالتقاط إحداثيات الزبون وإرفاقها بالطلب لتصل الأدمن.
- **لا يحتاج مفاتيح** — إذن المتصفح فقط.

---

## 9) المدفوعات (اختياري — غير مفعّل)

الكود جاهز في `src/lib/payments.ts` و `PaymentModal.tsx`. لتفعيله:
- Stripe: أضف `STRIPE_SECRET_KEY` + Webhook على `/api/public/stripe-webhook` (لم يُنشأ بعد).
- Paddle: بدائل عبر أداة `payments--enable_paddle_payments` في Lovable.

---

## 10) PicsArt / Canva (روابط تحرير خارجية)

- في `simulator.tsx` توجد أزرار placeholder لفتح PicsArt/Canva في تبويب جديد بالحساب المشترك. لا API — مجرّد Deep Links. يستطيع المالك لصق روابط اشتراكه المفعّل من لوحة الأدمن.

---

## 11) البنية التحتية والنشر

### Cloudflare Workers (الأساسي)
- `wrangler.jsonc` مضبوط مسبقاً بـ `nodejs_compat` و`main = .output/server/index.mjs`.
- الأمر: `bun run build` ثم `wrangler deploy`.
- المتغيّرات تُضاف من لوحة Cloudflare → Workers → Settings → Variables.

### Netlify (بديل)
- `netlify.toml` جاهز + `_redirects`.

### PWA
- `public/manifest.webmanifest` + `public/sw.js` + `src/lib/register-sw.ts` — التطبيق قابل للتثبيت على الجوال.

---

## 12) لوحة الأدمن

- المسار: `/admin` — محمي بكلمة سر عبر `src/lib/admin-gate.ts` (المفتاح في `src/lib/site-config.ts`).
- **مهم:** استبدل كلمة السر الافتراضية في `site-config.ts` قبل النشر.
- الأقسام:
  - **الطلبات (Kanban)** — سحب وإفلات بين الحالات (`KanbanBoard.tsx`).
  - **تحليلات حيّة** — إيرادات يومية/أسبوعية + توزّع المناطق (`AdminAnalytics.tsx`).
  - **جرس فوري** — Realtime notifications (`NewOrdersBell.tsx`).
  - **الإعدادات** — نسخ احتياطي/استيراد JSON، خلفيات وفيديوهات الواجهة، قوالب واتساب، الكوبونات، رفع مكتبة التصاميم بالجملة.

---

## 13) قائمة المفاتيح المطلوبة نهائياً

| المفتاح | إلزامي؟ | أين يُضاف |
|---|---|---|
| `LOVABLE_API_KEY` | نعم (لميزات AI) | Cloudflare Env |
| `REPLICATE_API_TOKEN` | اختياري | Cloudflare Env |
| `HF_TOKEN` | اختياري | Cloudflare Env |
| `STRIPE_SECRET_KEY` | اختياري (مدفوعات) | Cloudflare Env |
| كلمة سر الأدمن | نعم | `src/lib/site-config.ts` |
| رقم واتساب البائع | نعم | لوحة الأدمن |

---

## 14) الخطوات الفنية للاستكمال (Checklist للمختص)

- [ ] تنفيذ ترحيلات SQL 005 → 006 → 007 بالترتيب.
- [ ] تفعيل Realtime على جدول `orders`.
- [ ] إنشاء Storage buckets: `design-layers` (Public).
- [ ] إضافة `LOVABLE_API_KEY` كمتغيّر بيئة.
- [ ] تغيير كلمة سر الأدمن الافتراضية.
- [ ] رفع مكتبة التصاميم الأولية عبر `/bulk-upload-studio`.
- [ ] ضبط رقم واتساب وقوالب الرسائل من `/admin`.
- [ ] اختبار طلب تجريبي كامل: رفع غرفة → دمج → حفظ → إرسال طلب → استلامه في Kanban.
- [ ] نشر عبر `wrangler deploy` (أو Netlify).

---

## 15) بنية المجلدات المختصرة
```
src/
├── routes/          # صفحات (TanStack file-based routing)
│   ├── __root.tsx   # القالب الجذر (Head, providers)
│   ├── index.tsx    # يعيد التوجيه إلى /simulator
│   ├── simulator.tsx# القلب — محاكي الديكور
│   ├── gallery.tsx  # معرض أعمال الزبائن العام
│   ├── admin.tsx    # لوحة تحكم كاملة
│   └── api/         # HTTP endpoints خلفية
├── components/      # مكونات React قابلة لإعادة الاستخدام
├── lib/             # منطق أعمال + عملاء + helpers
│   └── *.server.ts  # حصراً على الخادم (لا تُشحن للمتصفح)
└── integrations/
    └── supabase/    # عميل Supabase
supabase-migrations/ # ملفات SQL بالترتيب
public/              # أصول ثابتة + PWA
```

---

**آخر تحديث:** جاهز للتسليم — الرجاء مراجعة الـ Checklist في القسم 14 قبل النشر.

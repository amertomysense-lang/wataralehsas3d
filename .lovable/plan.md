# خطة التنفيذ — منصة "وتر الإحساس" SaaS متعددة المستأجرين

نطاق ضخم؛ سأنفّذه على 6 مراحل متسلسلة في نفس الجلسة، ثم أصدّر الكود. أحتاج إجاباتك على 3 أسئلة حرجة قبل البدء (في النهاية).

---

## المرحلة 1 — الهوية البصرية والصفحة الرئيسية (Luxury Dark + Gold)

- تحديث `src/styles.css`: ثيم داكن فاخر (`--background` رمادي فحمي، `--primary` ذهبي كهرماني `oklch(0.78 0.15 75)`)، تدرجات ذهبية، ظلال ناعمة.
- خط العناوين: **Tajawal** أو **Cairo Display** (RTL).
- إعادة بناء `src/routes/index.tsx`:
  - Hero بعنوان: «مستقبل الديكور الرقمي والتجارة الذكية في الشمال»
  - عنوان فرعي يبرز: طباعة 8K، تأثيرات بروز ثلاثية الأبعاد ملموسة، تجربة AI افتراضية.
  - زر CTA رئيسي: «ابدأ التجربة التفاعلية الآن» → `/workflow`
- صفحة `/workflow`: محوّل بين 3 وحدات (محاكي الجدران، السوق، تجربة الأزياء).

## المرحلة 2 — PWA + Offline Sync

- `vite-plugin-pwa` مع `generateSW`، `autoUpdate`، `NetworkFirst` للـ HTML، `CacheFirst` للأصول.
- Wrapper تسجيل آمن (يرفض في معاينة Lovable، iframe، dev).
- **IndexedDB** عبر `idb`: جدول `pending_orders`.
- خطاف `useOnlineSync`: يستمع لـ `online` → يفرغ القائمة إلى `public.orders`.
- صفحة المنتج: إذا فشل `insert` بسبب الاتصال → خزّن محلياً + Toast «سيُرسل تلقائياً عند عودة الاتصال».

## المرحلة 3 — Module A: محاكي الجدران/الأرضيات

- صفحة `/simulator`:
  - رفع صورة الغرفة (Slot من كاميرا الهاتف).
  - طبقات SVG/PNG شفافة قابلة للسحب (Konva.js) + Pinch-to-Zoom + تشويه منظور (CSS `transform: matrix3d`).
  - فلاتر: خط عربي، رخام، كسر جدار 3D، إيبوكسي محيطي.
  - حاسبة: `W×H × price_per_meter × (1 + embossed?0.3:0)`.
  - **شحن**: زرّان شفافان:
    - «تأمين النقل من طرفك = $0»
    - «سيارة الشركة المدعومة = $0.30/كم» (من `regions.distance_km` — حقل جديد)
    - تنبيه ودّي: «مساهمة وقود مدعومة أقل من التكلفة الفعلية».

## المرحلة 4 — Module B: سوق الشركاء (Multi-Tenant)

هجرة SQL:
```sql
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text NOT NULL, -- 'curtains'|'sofa'|'furniture'|'fashion'
  whatsapp_number text NOT NULL,
  logo_url text,
  is_premium boolean DEFAULT false,
  region_id uuid REFERENCES public.regions(id),
  created_at timestamptz DEFAULT now()
);
-- GRANT + RLS (قراءة عامة، كتابة admin فقط)
```
- شريط جانبي في المحاكي: أصول PNG شفافة (ستائر، أرائك) قابلة للسحب فوق الجدار.
- عند طلب فيه عنصر vendor → فتح واتساب الـ vendor + نسخة لـ `orders` مع `vendor_id`.

## المرحلة 5 — Module C: AI Virtual Try-On

هجرة:
```sql
CREATE TABLE public.fashion_items(id, vendor_id, item_name, image_url, mask_url, price);
CREATE TABLE public.tryon_logs(id, user_phone, person_url, garment_id, result_url, created_at);
```
- صفحة `/tryon`: Slot A (صورة شخصية) + Slot B (قطعة من الكتالوج).
- Server route `/api/public/tryon`: ينادي Replicate API لـ **IDM-VTON** (`cuuupid/idm-vton`).
- نتيجة مركّبة عالية الدقة + زر «احجز القطعة الآن عبر واتساب المحل» → `vendor.whatsapp_number`.
- **يتطلب**: مفتاح `REPLICATE_API_TOKEN` (سأطلبه عبر `add_secret` لاحقاً).

## المرحلة 6 — الأدوار والأمان

- `/assistant`: تسجيل دخول بـ Supabase Auth + جدول `user_roles(user_id, role, region_id)`.
  - يرى فقط طلبات منطقته. حالات: New → Inspected → Active → Finished → Cancelled.
- `/admin`: محمي بـ `site-config.adminPassword` (الحالي) + يدير: الأسعار، المناطق، الـ vendors، رموز الـ premium، سجلات تدقيق.
- زر **«تصدير الكود الكامل»** في الأدمن: ينشئ tarball عبر server route.

---

## التقنيات المضافة

| المهمة | الحزمة |
|---|---|
| PWA | `vite-plugin-pwa`, `workbox-window` |
| IndexedDB | `idb` |
| Canvas Layers | `konva`, `react-konva` |
| AI Try-On | Replicate API (REST، بدون SDK) |
| Pinch/Zoom | `react-zoom-pan-pinch` |

---

## ⚠️ قبل أن أبدأ — أحتاج 3 إجابات:

1. **AI Try-On**: هل ستزوّدني بمفتاح **Replicate API** (مدفوع ~$0.05/صورة) أم أستخدم بديلاً مجانياً (Hugging Face Spaces — أبطأ وأقل جودة)؟
2. **مصفوفة المسافات (KM)**: هل أضيف عمود `distance_km` لكل منطقة في `regions` (تعدّله من الأدمن)، أم تريد مصفوفة `region_distances(from_id, to_id, km)` كاملة؟
3. **تصدير الكود**: زر التصدير من الأدمن → ZIP يُرفع لـ Supabase Storage، أم ملف ينزّل مباشرة في المتصفح؟

أجبني وسأنفّذ كل شيء دفعة واحدة.

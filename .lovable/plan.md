# خطة الترقية الشاملة

## 1) هوية بصرية نهارية فاخرة مبهجة (Light Luxury)
- خلفية بيضاء دافئة `#FBF7F0` مع تدرّجات ذهبية `#B8893A` وكريمية `#E8D5A8` ولمسات نبيذية `#7A1F2B` للأزرار الحيوية.
- بطاقات زجاجية شفافة (Glassmorphism) بحواف ذهبية رفيعة وظلال ناعمة متعددة الطبقات.
- خطوط: `Playfair Display` للعناوين + `Tajawal` للنص العربي (تحميل عبر `<link>` في `__root.tsx`).
- انتقالات ناعمة (spring easing) على كل البطاقات والأزرار.

## 2) سحب وإفلات في كل مكان (Drag & Drop Everywhere)
- **إفلات من سطح المكتب**: اسحب أي صورة جدار أو تصميم مباشرة إلى المحاكي (منطقة إفلات مضيئة).
- **مكتبة تصاميم عائمة**: شريط سفلي قابل للسحب فيه المكتبة الجاهزة — اسحب أي تصميم إلى الجدار.
- **إعادة ترتيب الطبقات** بالسحب.
- **إفلات من الحافظة** (Ctrl+V للصق صورة).

## 3) شريط أدوات عائم متطور (Floating Toolbar)
- شرائح دائرية (Radial sliders) للشفافية/الطمس/الإشراق.
- أزرار سريعة: قلب أفقي/عمودي، تدوير 90°، توسيط، ملء الجدار.
- Undo/Redo مع تاريخ 20 خطوة.
- حفظ preset تأثيرات مسمّاة.

## 4) محرر داخلي مدمج (In-App Editor)
- إزالة خلفية سريعة (يستدعي PicsArt API إن توفر، وإلا fallback محلي).
- فلاتر جاهزة: أبيض وأسود، سيبيا، فينتاج، حيوي، بارد، دافئ.
- إضافة نصوص وأشكال وقصاصات.
- تحسين الدقة (upscale) بضغطة زر.

## 5) تكامل PicsArt (مفتاح واحد)
- إضافة سرّ `PICSART_API_KEY` عبر Add Secret.
- إنشاء `src/routes/api/picsart.ts` بمسارات: `/removebg`، `/upscale`، `/effect`.
- زر "تحرير في PicsArt" داخل شريط الأدوات — يعمل مباشرة داخل التطبيق.

## 6) تكامل Canva Connect (OAuth رسمي)
- إضافة أسرار `CANVA_CLIENT_ID` و `CANVA_CLIENT_SECRET`.
- إنشاء `src/routes/api/canva/authorize.ts` و `callback.ts` و `import.ts`.
- زر "افتح في Canva" — يفتح Canva في نافذة، وعند حفظ التصميم يعود تلقائياً كطبقة داخل المحاكي.

## 7) ربط البريد الإلكتروني (Cloud Auth)
- تفعيل Lovable Cloud + تسجيل الدخول بالبريد و Google.
- ربط اشتراكات Canva/PicsArt بحساب المستخدم — كل مستخدم يوصل حسابه الخاص مرة واحدة.
- حفظ مشاريع المستخدم في قاعدة البيانات (جدول `user_projects`).

## 8) بطاقات حديثة في الصفحة الرئيسية
- 3D tilt عند تمرير الماوس.
- أيقونات متحركة (lucide + framer-motion).
- شارات (New, Pro, AI) لامعة.

## ملاحظة تقنية للمستخدم
لا يمكن استخدام اشتراكك المدفوع في Canva/PicsArt بتسجيل دخول واحد للجميع — سياسات الخدمتين تلزم كل مستخدم بربط حسابه الخاص عبر OAuth. البديل: **مفتاح PicsArt API واحد** يعمل بشكل مركزي وتُخصم استخداماته من حسابك مباشرة (مناسب لتطبيقك كخدمة B2C).

## الأسرار المطلوبة
- `PICSART_API_KEY` — من [PicsArt for Developers](https://picsart.io/api)
- `CANVA_CLIENT_ID` + `CANVA_CLIENT_SECRET` — من [Canva Developers](https://www.canva.com/developers/)
- Redirect URI للـ Canva: `https://wataralehsas3d.lovable.app/api/canva/callback`

## ملفات ستُنشأ/تُعدَّل
- `src/styles.css` — نظام تصميم جديد
- `src/routes/__root.tsx` — تحميل الخطوط
- `src/routes/index.tsx` — بطاقات 3D
- `src/routes/simulator.tsx` — سحب وإفلات + شريط أدوات عائم
- `src/components/FloatingToolbar.tsx` — جديد
- `src/components/DesignLibraryDock.tsx` — جديد
- `src/components/DropZone.tsx` — جديد
- `src/components/InAppEditor.tsx` — جديد
- `src/routes/api/picsart.ts` — جديد
- `src/routes/api/canva/*.ts` — جديد (3 ملفات)
- `supabase-migrations/007_user_projects.sql` — جديد

هل أبدأ التنفيذ؟ وهل ستزوّدني بمفاتيح PicsArt و Canva الآن أم أبني الواجهة أولاً وأترك الأزرار جاهزة تُفعَّل عند إضافة المفاتيح؟

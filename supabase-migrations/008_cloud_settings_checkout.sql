-- =====================================================================
-- منصة "وتر الإحساس" — إعدادات مركزية سحابية + حقول الطلب الجديدة
-- تُشغَّل مرة واحدة بعد 007_saved_projects.sql
-- =====================================================================

-- 1) جدول الإعدادات العامة (Singleton) — يديره الأدمن من لوحة التحكم
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                int PRIMARY KEY DEFAULT 1,
  brand_name        text NOT NULL DEFAULT 'وتر الإحساس',
  contact_whatsapp  text NOT NULL DEFAULT '963933000000',
  contact_email     text,
  hero_title        text DEFAULT 'حوّل جدارك إلى تحفة',
  hero_subtitle     text DEFAULT 'ارفع صورة جدارك، اسحب التصميم، وأتمم طلبك بضغطة.',
  sham_cash_number  text,
  sham_cash_name    text,
  sham_cash_qr_url  text,
  sham_cash_notes   text DEFAULT 'بعد التحويل، أرسل رقم العملية وكود الطلب عبر واتساب للتفعيل.',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps select" ON public.platform_settings;
DROP POLICY IF EXISTS "ps insert" ON public.platform_settings;
DROP POLICY IF EXISTS "ps update" ON public.platform_settings;
DROP POLICY IF EXISTS "ps delete" ON public.platform_settings;
CREATE POLICY "ps select" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "ps insert" ON public.platform_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "ps update" ON public.platform_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ps delete" ON public.platform_settings FOR DELETE USING (true);

INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2) توسعة جدول الطلبات لتطابق التدفق الجديد (اسم/عنوان/سطح/دفع)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name    text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS surface_status   text,  -- 'ready' | 'needs_prep'
  ADD COLUMN IF NOT EXISTS payment_method   text;  -- 'cod' | 'sham_cash'

-- 3) توحيد مراحل Kanban الأربع (نحدّث القيم القديمة تلقائياً)
UPDATE public.orders SET status = 'inspection'
  WHERE status IS NULL OR status IN ('new','inspected');
UPDATE public.orders SET status = 'printing'   WHERE status IN ('active');
UPDATE public.orders SET status = 'varnish'    WHERE status IN ('finished');
UPDATE public.orders SET status = 'delivered'  WHERE status IN ('done');

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'inspection';

-- =====================================================================
-- ✅ تم. جدول platform_settings جاهز، وحقول الطلب الجديدة مضافة،
--    ومراحل Kanban موحّدة (inspection → printing → varnish → delivered).
-- =====================================================================

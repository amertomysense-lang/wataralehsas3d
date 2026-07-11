-- 007 — مشاريع العملاء المحفوظة سحابياً + معرض عام
-- تشغيلها بعد 005/006 مباشرة.

DROP TABLE IF EXISTS public.saved_projects CASCADE;

CREATE TABLE public.saved_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    text NOT NULL,                 -- معرّف الجهاز (localStorage) — يتيح لكل زبون رؤية مشاريعه
  name         text NOT NULL,
  room_url     text,                          -- صورة الغرفة الأصلية
  design_url   text,                          -- التصميم المستخدم
  design_name  text,
  snapshot_url text,                          -- نتيجة الدمج النهائية (data:URL أو رابط تخزين)
  box          jsonb NOT NULL DEFAULT '{}'::jsonb,
  wall_points  jsonb NOT NULL DEFAULT '[]'::jsonb,
  surface      text,
  width_m      numeric,
  height_m     numeric,
  is_public    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_projects_device_idx ON public.saved_projects(device_id, created_at DESC);
CREATE INDEX saved_projects_public_idx ON public.saved_projects(is_public, created_at DESC) WHERE is_public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_projects TO authenticated;
GRANT ALL ON public.saved_projects TO service_role;

ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ العناصر العامة فقط
CREATE POLICY "public read gallery" ON public.saved_projects
  FOR SELECT TO anon, authenticated
  USING (is_public);

-- الزبون يقرأ/يعدّل/يحذف مشاريعه (حسب device_id في الترويسة x-device-id)
CREATE POLICY "device read own" ON public.saved_projects
  FOR SELECT TO anon, authenticated
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device insert own" ON public.saved_projects
  FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device update own" ON public.saved_projects
  FOR UPDATE TO anon, authenticated
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id')
  WITH CHECK (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device delete own" ON public.saved_projects
  FOR DELETE TO anon, authenticated
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');


-- Drop legacy device-header-based policies that depended on x-device-id request header
DROP POLICY IF EXISTS "saved device read anon"   ON public.saved_projects;
DROP POLICY IF EXISTS "saved device insert anon" ON public.saved_projects;
DROP POLICY IF EXISTS "saved device update anon" ON public.saved_projects;
DROP POLICY IF EXISTS "saved device delete anon" ON public.saved_projects;
DROP POLICY IF EXISTS "device read own"          ON public.saved_projects;
DROP POLICY IF EXISTS "device insert own"        ON public.saved_projects;
DROP POLICY IF EXISTS "device update own"        ON public.saved_projects;
DROP POLICY IF EXISTS "device delete own"        ON public.saved_projects;
DROP POLICY IF EXISTS "public read gallery"      ON public.saved_projects;

-- Public gallery reads (already present as "saved public gallery" but keep idempotent)
DROP POLICY IF EXISTS "sp public gallery" ON public.saved_projects;
CREATE POLICY "sp public gallery" ON public.saved_projects
  FOR SELECT TO anon, authenticated
  USING (is_public);

-- Anon / device-scoped rows: rely on the client always sending its own device_id.
-- (Device IDs are opaque random tokens stored in localStorage.)
CREATE POLICY "sp anon read own" ON public.saved_projects
  FOR SELECT TO anon, authenticated
  USING (user_id IS NULL AND device_id IS NOT NULL);

CREATE POLICY "sp anon insert" ON public.saved_projects
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL AND device_id IS NOT NULL);

CREATE POLICY "sp anon update own" ON public.saved_projects
  FOR UPDATE TO anon, authenticated
  USING (user_id IS NULL AND device_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND device_id IS NOT NULL);

CREATE POLICY "sp anon delete own" ON public.saved_projects
  FOR DELETE TO anon, authenticated
  USING (user_id IS NULL AND device_id IS NOT NULL);

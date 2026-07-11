
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own roles" ON public.user_roles;
CREATE POLICY "users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Drop all existing policies on affected tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders','tryon_logs','products','fashion_items','vendors',
                        'vendor_gallery','regions','pricing_config','platform_settings',
                        'cms_strings','saved_projects')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ORDERS
REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders insert public" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- TRYON_LOGS
REVOKE ALL ON public.tryon_logs FROM anon, authenticated;
GRANT INSERT ON public.tryon_logs TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.tryon_logs TO authenticated;
GRANT ALL ON public.tryon_logs TO service_role;
ALTER TABLE public.tryon_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tryon insert public" ON public.tryon_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tryon admin read" ON public.tryon_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "tryon admin update" ON public.tryon_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "tryon admin delete" ON public.tryon_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Catalog tables: public read, admin-only write
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','fashion_items','vendor_gallery','regions',
                           'pricing_config','platform_settings','cms_strings']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s public read" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s admin insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('CREATE POLICY "%s admin update" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('CREATE POLICY "%s admin delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t, t);
  END LOOP;
END $$;

-- VENDORS: public read of safe columns only (login_token excluded), admin-only write
REVOKE ALL ON public.vendors FROM anon, authenticated;
GRANT SELECT (id, business_name, name, category, whatsapp_number, phone,
              logo_url, cover_image, video_url, map_location, bio, is_premium,
              region_id, subscription_status, subscription_expires_at, created_at)
  ON public.vendors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors public read" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "vendors admin insert" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendors admin update" ON public.vendors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendors admin delete" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SAVED_PROJECTS: add auth-owner path, keep device path only for anon legacy
ALTER TABLE public.saved_projects
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS saved_projects_user_idx ON public.saved_projects(user_id, created_at DESC);

REVOKE ALL ON public.saved_projects FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_projects TO anon, authenticated;
GRANT ALL ON public.saved_projects TO service_role;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved public gallery" ON public.saved_projects FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "saved user read" ON public.saved_projects FOR SELECT TO authenticated USING (user_id IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "saved user insert" ON public.saved_projects FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "saved user update" ON public.saved_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved user delete" ON public.saved_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saved device read anon" ON public.saved_projects FOR SELECT TO anon USING (user_id IS NULL AND device_id IS NOT NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "saved device insert anon" ON public.saved_projects FOR INSERT TO anon WITH CHECK (user_id IS NULL AND device_id IS NOT NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "saved device update anon" ON public.saved_projects FOR UPDATE TO anon USING (user_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id') WITH CHECK (user_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "saved device delete anon" ON public.saved_projects FOR DELETE TO anon USING (user_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'x-device-id');

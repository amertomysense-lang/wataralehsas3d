
CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  whatsapp_number text NOT NULL DEFAULT '',
  assistant_name text,
  distance_km numeric DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_config (
  id int PRIMARY KEY DEFAULT 1,
  price_per_meter numeric NOT NULL DEFAULT 25,
  embossed_premium_rate numeric NOT NULL DEFAULT 0.3,
  currency text NOT NULL DEFAULT '$',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_config_singleton CHECK (id = 1)
);

CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  name text,
  category text NOT NULL DEFAULT 'other',
  whatsapp_number text NOT NULL DEFAULT '',
  phone text,
  logo_url text,
  cover_image text,
  video_url text,
  map_location text,
  bio text,
  is_premium boolean DEFAULT false,
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  login_token text UNIQUE,
  subscription_status text DEFAULT 'active',
  subscription_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  type text,
  category text,
  price numeric,
  price_usd numeric,
  price_try numeric,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_type ON public.products(type);

CREATE TABLE public.fashion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  image_url text NOT NULL,
  mask_url text,
  price numeric, price_usd numeric, price_try numeric,
  vendor_whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  region_name text,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  design_id uuid,
  design_name text,
  design_url text,
  width numeric NOT NULL DEFAULT 0,
  height numeric NOT NULL DEFAULT 0,
  embossed boolean NOT NULL DEFAULT false,
  total numeric NOT NULL DEFAULT 0,
  total_usd numeric,
  total_try numeric,
  shipping_mode text,
  shipping_cost numeric DEFAULT 0,
  customer_name text,
  customer_phone text,
  customer_address text,
  surface_status text,
  payment_method text,
  status text NOT NULL DEFAULT 'inspection',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_region ON public.orders(region_id);

CREATE TABLE public.tryon_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text, person_url text,
  garment_id uuid REFERENCES public.fashion_items(id) ON DELETE SET NULL,
  result_url text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  image_url text NOT NULL, caption text, sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  room_url text,
  design_url text,
  design_name text,
  snapshot_url text,
  box jsonb NOT NULL DEFAULT '{}'::jsonb,
  wall_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  surface text,
  width_m numeric,
  height_m numeric,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_projects_device_idx ON public.saved_projects(device_id, created_at DESC);
CREATE INDEX saved_projects_public_idx ON public.saved_projects(is_public, created_at DESC) WHERE is_public;

CREATE TABLE public.platform_settings (
  id int PRIMARY KEY DEFAULT 1,
  brand_name text NOT NULL DEFAULT 'وتر الإحساس',
  contact_whatsapp text NOT NULL DEFAULT '963933000000',
  contact_email text,
  hero_title text DEFAULT 'حوّل جدارك إلى تحفة',
  hero_subtitle text DEFAULT 'ارفع صورة جدارك، اسحب التصميم، وأتمم طلبك بضغطة.',
  sham_cash_number text,
  sham_cash_name text,
  sham_cash_qr_url text,
  sham_cash_notes text DEFAULT 'بعد التحويل، أرسل رقم العملية وكود الطلب عبر واتساب للتفعيل.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

CREATE TABLE public.cms_strings (
  key text PRIMARY KEY,
  value text NOT NULL,
  category text DEFAULT 'general',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fashion_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tryon_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_gallery TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_strings TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fashion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_strings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'regions','pricing_config','vendors','products','fashion_items',
    'orders','tryon_logs','vendor_gallery','platform_settings','cms_strings'
  ] LOOP
    EXECUTE format('CREATE POLICY "%s all select" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s all insert" ON public.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s all update" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s all delete" ON public.%I FOR DELETE USING (true)', t, t);
  END LOOP;
END$$;

CREATE POLICY "sp public read" ON public.saved_projects FOR SELECT USING (is_public);
CREATE POLICY "sp device read" ON public.saved_projects FOR SELECT
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "sp device insert" ON public.saved_projects FOR INSERT
  WITH CHECK (device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "sp device update" ON public.saved_projects FOR UPDATE
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id')
  WITH CHECK (device_id = current_setting('request.headers', true)::json->>'x-device-id');
CREATE POLICY "sp device delete" ON public.saved_projects FOR DELETE
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

INSERT INTO public.pricing_config (id, price_per_meter, embossed_premium_rate, currency)
  VALUES (1, 25, 0.3, '$') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.regions (name, whatsapp_number, assistant_name, distance_km) VALUES
  ('الدانا', '963933000000', 'مساعد الدانا', 8),
  ('سرمدا', '963933000001', 'مساعد سرمدا', 15),
  ('إدلب', '963933000002', 'مساعد إدلب', 30),
  ('أرياف حلب', '963933000003', 'مساعد حلب', 45)
ON CONFLICT (name) DO NOTHING;


-- Allow anon writes on admin-managed tables (device-based admin panel, no auth)
GRANT INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT INSERT, UPDATE, DELETE ON public.platform_settings TO anon;
GRANT INSERT, UPDATE, DELETE ON public.pricing_config TO anon;
GRANT INSERT, UPDATE, DELETE ON public.regions TO anon;
GRANT INSERT, UPDATE, DELETE ON public.cms_strings TO anon;

-- Add anon policies (drop-if-exist first for idempotency)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','platform_settings','pricing_config','regions','cms_strings']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s anon insert" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s anon update" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s anon delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s anon insert" ON public.%I FOR INSERT TO anon WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s anon update" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s anon delete" ON public.%I FOR DELETE TO anon USING (true)', t, t);
  END LOOP;
END $$;


REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "orders insert public" ON public.orders;
CREATE POLICY "orders insert public" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL AND length(btrim(customer_name)) > 0
    AND customer_phone IS NOT NULL AND length(btrim(customer_phone)) > 0
  );

DROP POLICY IF EXISTS "tryon insert public" ON public.tryon_logs;
CREATE POLICY "tryon insert public" ON public.tryon_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (created_at IS NULL OR created_at <= now() + interval '1 minute');

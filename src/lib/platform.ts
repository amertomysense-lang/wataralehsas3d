import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Region = {
  id: string;
  name: string;
  whatsapp_number: string;
  assistant_name: string | null;
  is_active: boolean;
  distance_km?: number | null;
};

export type Pricing = {
  id: number;
  price_per_meter: number;
  embossed_premium_rate: number;
  currency: string;
};

export type Order = {
  id: string;
  region_id: string | null;
  region_name: string | null;
  design_id: string | null;
  design_name: string | null;
  design_url: string | null;
  width: number;
  height: number;
  embossed: boolean;
  total: number;
  customer_phone: string | null;
  status: string;
  created_at: string;
};

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async (): Promise<Region[]> => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });
}

export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async (): Promise<Pricing> => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as Pricing) ?? { id: 1, price_per_meter: 25, embossed_premium_rate: 0.3, currency: "$" };
    },
  });
}

export function calcTotal(width: number, height: number, embossed: boolean, p: Pricing) {
  const base = Math.max(0, width) * Math.max(0, height) * Number(p.price_per_meter);
  return embossed ? base * (1 + Number(p.embossed_premium_rate)) : base;
}

export function buildWhatsAppUrl(opts: {
  number: string;
  region: string;
  width: number;
  height: number;
  embossed: boolean;
  designName: string;
  designUrl: string;
  total: number;
  currency: string;
}) {
  const txt = `مرحباً فريق طابعات الجدران الرقمية - فرع ${opts.region}.
لقد قمت بمعاينة المحاكي وأرغب بحجز موعد.
المدينة/المنطقة: ${opts.region}
المقاسات: ${opts.width}م × ${opts.height}م | ميزة البروز: ${opts.embossed ? "نعم" : "لا"}
التصميم: ${opts.designName}
رابط التصميم: ${opts.designUrl}
التكلفة المقدرة: ${opts.total.toLocaleString("ar")} ${opts.currency}`;
  return `https://wa.me/${opts.number}?text=${encodeURIComponent(txt)}`;
}

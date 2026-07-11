import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CloudSettings = {
  id: number;
  brand_name: string;
  contact_whatsapp: string;
  contact_email: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  sham_cash_number: string | null;
  sham_cash_name: string | null;
  sham_cash_qr_url: string | null;
  sham_cash_notes: string | null;
  updated_at?: string;
};

export const DEFAULT_CLOUD: CloudSettings = {
  id: 1,
  brand_name: "وتر الإحساس",
  contact_whatsapp: "963933000000",
  contact_email: null,
  hero_title: "حوّل جدارك إلى تحفة",
  hero_subtitle: "ارفع صورة جدارك، اسحب التصميم، وأتمم طلبك بضغطة.",
  sham_cash_number: null,
  sham_cash_name: null,
  sham_cash_qr_url: null,
  sham_cash_notes: "بعد التحويل، أرسل رقم العملية وكود الطلب عبر واتساب للتفعيل.",
};

export function useCloudSettings() {
  return useQuery({
    queryKey: ["platform_settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<CloudSettings> => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) return DEFAULT_CLOUD;
      return { ...DEFAULT_CLOUD, ...(data ?? {}) } as CloudSettings;
    },
  });
}

export function useSaveCloudSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<CloudSettings>) => {
      const payload = { id: 1, ...patch, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from("platform_settings")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform_settings"] });
      toast.success("تم حفظ الإعدادات ✓");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "تعذّر الحفظ";
      toast.error(msg);
    },
  });
}

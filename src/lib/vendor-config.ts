// إعدادات تشغيلية لكل شريك — تُحفظ محلياً لتجاوز قيود schema
// (وحدات مفعّلة + حالة الاشتراك). يمكن لاحقاً ترحيلها إلى عمود JSON في vendors.
import { useEffect, useState } from "react";

export type VendorModules = {
  decor: boolean;       // محاكي الديكور
  fashion: boolean;     // غرفة الأزياء
  haircut: boolean;     // تجربة قصات الشعر
};

export type VendorState = {
  modules: VendorModules;
  subscription_active: boolean;  // ظهور الشريك ومنتجاته
  brand_badge?: string;          // شارة تخصصية (اختياري)
};

export const DEFAULT_VENDOR_STATE: VendorState = {
  modules: { decor: true, fashion: false, haircut: false },
  subscription_active: true,
};

const KEY = "watar.vendor.config.v1";

type Store = Record<string, VendorState>;

export function readVendorStore(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function writeVendorStore(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("watar:vendor-config"));
}

export function getVendorState(id: string): VendorState {
  const s = readVendorStore();
  return s[id] ?? DEFAULT_VENDOR_STATE;
}

export function setVendorState(id: string, next: VendorState) {
  const s = readVendorStore();
  s[id] = next;
  writeVendorStore(s);
}

export function useVendorStore(): [Store, (id: string, next: VendorState) => void] {
  const [s, setS] = useState<Store>({});
  useEffect(() => {
    setS(readVendorStore());
    const h = () => setS(readVendorStore());
    window.addEventListener("watar:vendor-config", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("watar:vendor-config", h); window.removeEventListener("storage", h); };
  }, []);
  return [s, (id, next) => { setVendorState(id, next); setS(readVendorStore()); }];
}

// إعدادات المنصة الشاملة — تُحفظ محلياً ويمكن للأدمن تعديلها فوراً
// (تتجاوز أي قيم في pricing_config عندما تكون موجودة)
import { useEffect, useState } from "react";

export type PlatformSettings = {
  currency: string;           // مثل: $ / TRY / ل.س
  fuelPerKm: number;          // تكلفة الوقود المدعوم لكل كم
  embossedRate: number;       // نسبة البروز (0.30 = 30%)
  pricePerMeter: number;      // السعر/متر² الافتراضي
  aiTryOnLogging: boolean;    // تفعيل تسجيل تجارب AI Try-On
  showMarketingBanner: boolean; // إظهار قسم حملة الإطلاق
  fleetMobilizationEnabled: boolean; // إظهار خدمة الأسطول السريع
  enableOfflineSync: boolean;
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  currency: "$",
  fuelPerKm: 0.3,
  embossedRate: 0.3,
  pricePerMeter: 25,
  aiTryOnLogging: true,
  showMarketingBanner: true,
  fleetMobilizationEnabled: true,
  enableOfflineSync: true,
};

const KEY = "watar.platform.settings.v2";

export function readSettings(): PlatformSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

export function writeSettings(next: PlatformSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("watar:settings"));
}

export function useSettings(): [PlatformSettings, (s: PlatformSettings) => void] {
  const [s, setS] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(readSettings());
    const h = () => setS(readSettings());
    window.addEventListener("watar:settings", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("watar:settings", h); window.removeEventListener("storage", h); };
  }, []);
  return [s, (n) => { writeSettings(n); setS(n); }];
}

// الأقاليم السورية المقترحة لتفعيل سريع
export const SYRIAN_PROVINCES = [
  "الدانا","سرمدا","إدلب","حلب","ريف حلب","دمشق","ريف دمشق",
  "حمص","حماة","طرطوس","اللاذقية","دير الزور","الرقة","الحسكة","درعا","السويداء","القنيطرة",
];

// عدّاد محلي يحد المستخدم المجاني بـ 3 توليدات AI يومياً
import { useEffect, useState } from "react";

const KEY = "watar.ai.quota.v1";
export const DAILY_LIMIT = 3;

type Q = { day: string; count: number };

function today() { return new Date().toISOString().slice(0, 10); }

export function readQuota(): Q {
  if (typeof window === "undefined") return { day: today(), count: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { day: today(), count: 0 };
    const q = JSON.parse(raw) as Q;
    if (q.day !== today()) return { day: today(), count: 0 };
    return q;
  } catch { return { day: today(), count: 0 }; }
}

export function remainingQuota(): number {
  return Math.max(0, DAILY_LIMIT - readQuota().count);
}

export function consumeQuota(): boolean {
  const q = readQuota();
  if (q.count >= DAILY_LIMIT) return false;
  const next = { day: today(), count: q.count + 1 };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("watar:quota"));
  return true;
}

export function useQuota() {
  const [n, setN] = useState<number>(DAILY_LIMIT);
  useEffect(() => {
    const refresh = () => setN(remainingQuota());
    refresh();
    window.addEventListener("watar:quota", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("watar:quota", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return n;
}

export const QUOTA_EXCEEDED_MSG =
  "لقد استهلكت محاولاتك المجانية اليومية، انتظر للغد أو قم بزيارة أحد صالوناتنا الشريكة المعتمدة لتجربة غير محدودة!";

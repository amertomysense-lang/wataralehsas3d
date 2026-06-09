// مساعدات حفظ/مشاركة الصور على الجوال
// يستخدم Web Share API على الهاتف؛ يسقط إلى تنزيل عادي على بقية المتصفحات
import { toast } from "sonner";

async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith("data:")) {
    const res = await fetch(url);
    return await res.blob();
  }
  const res = await fetch(url, { mode: "cors" });
  return await res.blob();
}

export async function saveImageToDevice(url: string, filename = `watar-${Date.now()}.jpg`) {
  try {
    const blob = await urlToBlob(url);
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

    // 1) جرّب Web Share API مع ملفات (الأفضل على الجوال — يفتح خيار "حفظ في الصور")
    const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "وتر الإحساس", text: "صورة من وتر الإحساس" });
      toast.success("تم إرسال الصورة — اختر «حفظ في الصور» من القائمة");
      return;
    }

    // 2) تنزيل تقليدي عبر رابط
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    toast.success("تم تنزيل الصورة على جهازك");
  } catch (e) {
    toast.error("تعذّر الحفظ — جرّب الضغط المطوّل على الصورة ثم «حفظ»");
  }
}

export async function shareImageWhatsApp(url: string, text = "شاهد صورتي من وتر الإحساس ✨") {
  try {
    const blob = await urlToBlob(url);
    const file = new File([blob], `watar-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
    const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
  } catch {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
  }
}

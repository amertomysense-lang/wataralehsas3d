import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

/**
 * خلفية موقع فاخرة — صورة و/أو فيديو ثابت خلف كل الواجهات مع تحكم بالشفافية.
 * تُحقن قواعد CSS لجعل خلفيات الصفحات شبه شفافة كي تظهر الخلفية المخصّصة في المقدمة
 * بدل الخلفية البيضاء الافتراضية.
 */
export function SiteBackground() {
  const [s] = useSettings();
  const hasImage = !!s.customBgImage;
  const hasVideo = s.bgVideoEnabled && (s.customVideos?.length ?? 0) > 0;
  const active = hasImage || hasVideo;

  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("has-site-bg");
    return () => document.documentElement.classList.remove("has-site-bg");
  }, [active]);

  if (!active) return null;

  const videoUrl = hasVideo ? s.customVideos[0].url : null;

  return (
    <>
      {/* حقن CSS يجعل خلفيات الصفحات نصف شفافة كي تظهر الخلفية المخصّصة */}
      <style>{`
        html.has-site-bg body { background-color: transparent !important; }
        html.has-site-bg .bg-background { background-color: color-mix(in oklab, hsl(var(--background)) 55%, transparent) !important; }
      `}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {hasImage && (
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${s.customBgImage})`, opacity: s.customBgOpacity ?? 0.35 }}
          />
        )}
        {videoUrl && (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: s.bgVideoOpacity ?? 0.4 }}
          />
        )}
      </div>
    </>
  );
}

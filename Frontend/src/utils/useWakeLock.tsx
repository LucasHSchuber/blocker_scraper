import { useEffect, useRef } from "react";

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          console.log("🔋 Requesting wake lock…");
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          console.log("✅ Wake lock acquired.");
          
          // Re-acquire if released (e.g. when tab goes in background/returns)
          wakeLockRef.current && wakeLockRef.current.addEventListener("release", () => {
            console.log("⚠️ Wake lock was released!");
            if (!cancelled && active) {
              console.log("🔄 Trying to re-acquire wake lock…");
              requestWakeLock();
            }
          });
        } else {
          console.warn("Wake Lock API not supported in this browser.");
        }
      } catch (err) {
        console.error("WakeLock request failed:", err);
      }
    }

    if (active) {
      requestWakeLock();
    }

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        console.log("🛑 Releasing wake lock manually.");
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [active]);
}

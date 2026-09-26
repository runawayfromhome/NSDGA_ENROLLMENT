// A small global banner shown whenever the browser reports it is offline.
// NOTE: navigator.onLine only detects a missing network connection — it cannot
// tell whether the internet / Supabase is truly reachable (e.g. captive WiFi or
// a cloud outage). Those cases still surface as per-action error messages.
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 text-center shadow-lg">
      ⚠️ Walang koneksyon sa internet — hindi mase-save o ma-lo-load ang mga bagong datos hanggang bumalik ang koneksyon.
    </div>
  );
}

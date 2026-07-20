// Guarded service worker registration.
// Never registers in dev, Lovable preview, iframes, or when ?sw=off is set.
// Kill-switch: append ?sw=off to any URL to unregister the SW.

const SW_URL = "/sw.js";

function isRefusedContext(): { refused: boolean; reason?: string } {
  if (!import.meta.env.PROD) return { refused: true, reason: "not production" };
  if (typeof window === "undefined") return { refused: true, reason: "no window" };
  try {
    if (window.self !== window.top) return { refused: true, reason: "iframe" };
  } catch {
    return { refused: true, reason: "cross-origin iframe" };
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return { refused: true, reason: "lovable preview host" };
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("sw") === "off") return { refused: true, reason: "?sw=off kill switch" };
  return { refused: false };
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export function registerAppServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const { refused, reason } = isRefusedContext();
  if (refused) {
    // Always clean up any stale registrations in refused contexts.
    void unregisterMatching();
    if (import.meta.env.DEV) console.info(`[sw] registration skipped (${reason})`);
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch((err) => {
      console.warn("[sw] registration failed", err);
    });
  });
}

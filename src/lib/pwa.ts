/**
 * Service-worker registration wrapper. Registration is refused in dev,
 * inside iframes and in every Lovable preview host so the editor never
 * serves stale HTML. `?sw=off` acts as a kill switch.
 */
const SW_URL = "/sw.js";

function isBlockedHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
  );
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const inIframe = window.self !== window.top;
  const swOff = new URLSearchParams(window.location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || swOff || isBlockedHost(window.location.hostname)) {
    await unregisterExisting().catch(() => {});
    return;
  }
  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch (err) {
    console.warn("[dayforge] service worker registration failed", err);
  }
}

/** Ask the browser to keep our IndexedDB data across restarts / storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
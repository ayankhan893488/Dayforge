/**
 * Optional daily attendance reminder. Uses the Notification API when the
 * browser allows it and silently does nothing when it doesn't, so the app
 * never breaks on unsupported platforms.
 */
let timer: ReturnType<typeof setTimeout> | null = null;

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function msUntil(time: string) {
  const [h, m] = time.split(":").map(Number);
  const next = new Date();
  next.setHours(h || 0, m || 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime() - Date.now();
}

function show(appName: string) {
  try {
    new Notification(`${appName} reminder`, {
      body: "Don't forget to mark today's attendance.",
      icon: "/icon-192.png",
      tag: "dayforge-daily-reminder",
    });
  } catch {
    /* ignore — notifications unavailable */
  }
}

/** (Re)schedules the daily reminder while the app is open. */
export function scheduleReminder(opts: { enabled: boolean; time: string; appName: string }) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (typeof window === "undefined") return;
  if (!opts.enabled || !notificationsSupported() || Notification.permission !== "granted") return;
  const tick = () => {
    show(opts.appName);
    timer = setTimeout(tick, 24 * 60 * 60 * 1000);
  };
  timer = setTimeout(tick, msUntil(opts.time || "19:00"));
}
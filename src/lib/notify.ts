import { usePrefs } from "./prefs";

/** يسجّل عامل الخدمة الخاص بالإشعارات (بدون تخزين مؤقت للصفحات) */
export async function registerNotificationWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** يطلب إذن الإشعارات ويجهّز PushManager */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  await registerNotificationWorker();
  return true;
}

/** يعرض إشعارًا محليًا عبر عامل الخدمة إن توفّر */
export async function showLocalNotification(title: string, body: string, url = "/home") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const reg = (await navigator.serviceWorker?.getRegistration()) ?? (await registerNotificationWorker());
  const options: NotificationOptions = {
    body,
    icon: "/favicon.png",
    dir: "rtl",
    lang: "ar",
    data: { url },
  };
  if (reg) await reg.showNotification(title, options);
  else new Notification(title, options);
}

/** مفتاح لمنع تكرار نفس الإشعار في اليوم نفسه */
export function onceToday(key: string) {
  if (typeof localStorage === "undefined") return false;
  const today = new Date().toISOString().slice(0, 10);
  const k = `gamehub:notified:${key}`;
  if (localStorage.getItem(k) === today) return false;
  localStorage.setItem(k, today);
  return true;
}

/** مفتاح لمنع تكرار التنبيه أكثر من مرة في الجلسة الواحدة */
export function onceThisSession(key: string) {
  if (typeof sessionStorage === "undefined") return false;
  const k = `gamehub:session:${key}`;
  if (sessionStorage.getItem(k)) return false;
  sessionStorage.setItem(k, "1");
  return true;
}

export const notifyPrefs = () => usePrefs.getState();

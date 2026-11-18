// Mini Bot Web — سرویس‌ورکر حداقلی برای قابلیت نصب (PWA)
// هیچ فایلی کش نمی‌شود تا پنل همیشه نسخه تازه را بگیرد.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== location.origin) return;
  if (u.pathname.indexOf("/api") === 0) return;
  e.respondWith(fetch(req).catch(() => Response.error()));
});

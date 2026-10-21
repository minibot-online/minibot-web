// Mini Bot — فرانت‌اند پنل کاربران (نسخه وب)
// فایل‌های استاتیک محلی سرو می‌شوند و درخواست‌های API به سرور ربات پروکسی می‌شوند.
// v13 چند-سروری: اگر کلاینت هدر x-server (شناسه سرور انتخاب‌شده در صفحه ورود) بفرستد،
// درخواست به همان سرور می‌رود؛ لیست مجازِ سرورها از سرور اصلی (UPSTREAM) گرفته می‌شود.

const UPSTREAM = "https://minibot-mine.onrender.com"; // سرور ۱ — نگهدارنده لیست سرورها

let _regCache = { ts: 0, list: [] };
async function getRegistry() {
  // کش ۶۰ ثانیه‌ای از /api/servers سرور اصلی
  if (Date.now() - _regCache.ts < 60000 && _regCache.list.length) return _regCache.list;
  try {
    const r = await fetch(UPSTREAM + "/api/servers", { headers: { "Content-Type": "application/json" } });
    const j = await r.json();
    const list = (j && Array.isArray(j.servers) ? j.servers : []).filter(s => s && s.id && /^https:\/\/[a-z0-9.-]+/i.test(s.url || ""));
    _regCache = { ts: Date.now(), list };
    return list;
  } catch (e) {
    return _regCache.list || [];
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      let target = UPSTREAM;
      // لیست سرورها همیشه روی سرور اصلی نگهداری می‌شود؛ حتی اگر کاربر سرور دیگری انتخاب کرده باشد
      const isRegistryPath = url.pathname === "/api/servers" || url.pathname === "/api/admin/servers";
      const sid = isRegistryPath ? null : request.headers.get("x-server");
      if (sid) {
        const reg = await getRegistry();
        const s = reg.find(x => x.id === sid);
        if (s) target = s.url; // سرور ناشناس → پیش‌فرض (سرور اصلی)
      }
      const upstreamReq = new Request(target + url.pathname + url.search, request);
      upstreamReq.headers.delete("x-server");
      if (url.pathname === "/api/servers" && request.method === "GET") {
        try {
          const ctl = new AbortController();
          const tm = setTimeout(() => ctl.abort(), 8000);
          const res = await fetch(upstreamReq, { signal: ctl.signal });
          clearTimeout(tm);
          if (res.ok) return res;
        } catch (e) {}
        const reg = await getRegistry();
        return new Response(JSON.stringify({ servers: reg }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      }
      return fetch(upstreamReq);
    }
    const res = await env.ASSETS.fetch(request);
    if (url.pathname.endsWith("/") || url.pathname.endsWith(".html") || !url.pathname.split("/").pop().includes(".")) {
      const h = new Headers(res.headers);
      h.set("Cache-Control", "no-store");
      return new Response(res.body, { status: res.status, headers: h });
    }
    return res;
  }
};

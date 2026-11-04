/* Mini Bot Web — کارت اشتراک (بدون پلن و بدون خرید) */
(function () {
  var KEY = "mb_plan_cache";
  function el(id) { return document.getElementById(id); }
  function fa(n) { return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function fmtDate(ts) {
    var d = new Date(ts), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate());
  }
  function paint(p) {
    if (!p) return;
    var label = el("piLabel"), left = el("piLeft"), end = el("piEnd");
    if (!label) return;
    if (!p.set) {
      label.textContent = "تنظیم نشده";
      left.textContent = "—";
      end.textContent = "—";
      return;
    }
    label.textContent = p.label || "—";
    if (p.expired) {
      left.textContent = "منقضی شده";
    } else if (p.isFree && typeof p.hoursLeft === "number") {
      left.textContent = fa(p.hoursLeft) + " ساعت";
    } else {
      left.textContent = fa(p.daysLeft) + " روز";
    }
    end.textContent = p.expiresAt ? fmtDate(p.expiresAt) : "—";
  }
  function load() {
    fetch("/api/plan", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok && j.plan) { paint(j.plan); try { sessionStorage.setItem(KEY, JSON.stringify(j.plan)); } catch (e) {} } })
      .catch(function () {});
  }
  // نقاشی فوری از حافظه، بعد تازه‌سازی از سرور
  try {
    var c = sessionStorage.getItem(KEY);
    if (c) paint(JSON.parse(c));
  } catch (e) {}
  document.addEventListener("click", function (ev) {
    var row = ev.target.closest && ev.target.closest('.ws-row[data-ws="plan"]');
    if (row) load();
  });
  window.addEventListener("load", function () {
    setTimeout(function () { if (document.getElementById("piLabel")) load(); }, 1200);
  });
  setInterval(function () { if (document.getElementById("piLabel")) load(); }, 60000);
})();

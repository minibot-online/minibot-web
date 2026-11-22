/* کاروسل کارت‌های داشبورد: پلن | تشخیص فیش تکراری | ارسال به تأیید کننده
   فقط وضعیت را از المان‌های موجود کپی می‌کند و کلیک سوییچ را به همان سوییچ اصلی می‌فرستد. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var MAP = [
    { src: "dupToggle",        tgl: "fbcDupToggle",     st: "fbcDupState",     stTxt: "fbcDupStateText",     sub: "fbcDupSub",     subSrc: "dupStatus",     on: "روشن",  off: "خاموش" },
    { src: "confirmDashToggle", tgl: "fbcConfirmToggle", st: "fbcConfirmState", stTxt: "fbcConfirmStateText", sub: "fbcConfirmSub", subSrc: "confirmStatus", on: "فعال", off: "خاموش" }
  ];

  function sync() {
    MAP.forEach(function (m) {
      var src = $(m.src), tgl = $(m.tgl), st = $(m.st), stTxt = $(m.stTxt);
      if (!src || !tgl) return;
      var on = src.classList.contains("on");
      tgl.classList.toggle("on", on);
      if (st) st.classList.toggle("off", !on);
      if (stTxt) stTxt.textContent = on ? m.on : m.off;
      var subSrc = $(m.subSrc), sub = $(m.sub);
      if (subSrc && sub && subSrc.textContent.trim()) sub.textContent = subSrc.textContent.trim();
    });
    syncClones();
  }

  /* کپی‌های کاروسل را با اسلاید واقعی هم‌وضعیت نگه می‌دارد */
  function syncClones() {
    var car = $("dashCarousel");
    if (!car || !car._dcReal) return;
    var clones = car.querySelectorAll('.dc-slide[data-clone="1"]');
    var n = car._dcReal.length;
    for (var i = 0; i < clones.length; i++) {
      var src = car._dcReal[i % n];
      var a = src.querySelectorAll("*"), b = clones[i].querySelectorAll("*");
      if (a.length !== b.length) continue;
      for (var k = 0; k < a.length; k++) {
        if (b[k].className !== a[k].className) b[k].className = a[k].className;
        if (a[k].children.length === 0 && b[k].textContent !== a[k].textContent) b[k].textContent = a[k].textContent;
      }
    }
  }

  function bind() {
    var car = $("dashCarousel");
    if (!car || car._bound) return;
    car._bound = true;

    /* سوییچ روی کارت = همان سوییچ اصلی (منطق ذخیره/توست/قفل‌ها دست‌نخورده می‌ماند) */
    MAP.forEach(function (m) {
      var tgl = $(m.tgl);
      if (!tgl) return;
      tgl.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var src = $(m.src);
        if (src) src.click();
        setTimeout(sync, 60);
        setTimeout(sync, 400);
      });
    });

    /* ---------- چرخش بی‌پایان: کپی از ابتدا و انتهای لیست، پرش بی‌صدا به اسلاید واقعی ---------- */
    var dots = $("dashDots") ? $("dashDots").children : [];
    var real = Array.prototype.slice.call(car.querySelectorAll(".dc-slide"));
    var N = real.length;
    var first = real[0], last = real[N - 1];
    var cloneBefore = [], cloneAfter = [];
    if (N > 1) {
      for (var k = 0; k < N; k++) {
        var cb = real[k].cloneNode(true); cb.setAttribute("data-clone", "1"); cb.setAttribute("aria-hidden", "true");
        var ca = real[k].cloneNode(true); ca.setAttribute("data-clone", "1"); ca.setAttribute("aria-hidden", "true");
        [cb, ca].forEach(function (c) {
          /* کپی‌ها فقط نمایشی‌اند: بدون id و بدون فوکوس؛ کلیکشان به کارت اصلی می‌رود */
          Array.prototype.forEach.call(c.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
          Array.prototype.forEach.call(c.querySelectorAll("[tabindex]"), function (n) { n.setAttribute("tabindex", "-1"); });
        });
        cloneBefore.push(cb); cloneAfter.push(ca);
      }
      cloneBefore.forEach(function (c) { car.insertBefore(c, first); });
      cloneAfter.forEach(function (c) { car.appendChild(c); });
    }
    var all = Array.prototype.slice.call(car.querySelectorAll(".dc-slide"));

    function slideCenter(el) {
      /* مرکز اسلاید نسبت به scrollLeft کاروسل (RTL-safe با getBoundingClientRect) */
      var b = car.getBoundingClientRect(), r = el.getBoundingClientRect();
      return (r.left + r.width / 2) - (b.left + b.width / 2);
    }
    function nearestIndex() {
      var best = 0, bestD = Infinity;
      for (var i = 0; i < all.length; i++) {
        var d = Math.abs(slideCenter(all[i]));
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }
    function jumpTo(idx) {
      var prev = car.style.scrollSnapType;
      car.style.scrollSnapType = "none";
      car.scrollLeft += slideCenter(all[idx]);
      /* دو فریم صبر می‌کنیم تا مرورگر جابجایی را اعمال کند، بعد snap برگردد */
      requestAnimationFrame(function () { requestAnimationFrame(function () { car.style.scrollSnapType = prev || ""; }); });
    }
    function realIndex(i) { return N > 1 ? ((i - N) % N + N) % N : 0; }

    function updateActive() {
      var idx = nearestIndex(), ri = realIndex(idx);
      for (var i = 0; i < all.length; i++) all[i].classList.toggle("is-active", i === idx);
      for (var j = 0; j < dots.length; j++) dots[j].classList.toggle("on", j === ri);
      return idx;
    }

    /* وقتی کاربر به یک کپی رسید و اسکرول متوقف شد → بی‌صدا به اسلاید واقعی هم‌ارز برو */
    var settle = 0;
    function onSettled() {
      if (N < 2) return;
      var idx = nearestIndex();
      if (idx < N || idx >= 2 * N) { jumpTo(N + realIndex(idx)); setTimeout(updateActive, 40); }
    }
    var raf = 0;
    car.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; updateActive(); });
      clearTimeout(settle);
      settle = setTimeout(onSettled, 110);
    }, { passive: true });
    if ("onscrollend" in window) car.addEventListener("scrollend", function () { clearTimeout(settle); onSettled(); });

    for (var d = 0; d < dots.length; d++) {
      (function (i) {
        dots[i].addEventListener("click", function () {
          var cur = nearestIndex(), curReal = realIndex(cur);
          var target = all[cur + (i - curReal)];
          if (target) target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      })(d);
    }

    /* شروع از اولین اسلاید واقعی */
    function start() { if (N > 1) jumpTo(N); setTimeout(updateActive, 30); }
    start();
    window.addEventListener("load", start);
    window.addEventListener("resize", function () { if (N > 1) { var r = realIndex(nearestIndex()); jumpTo(N + r); setTimeout(updateActive, 30); } });
    car._dcReal = real;

    /* ---------- کلیک روی کارت‌های کناری/کپی‌ها ---------- */
    car.addEventListener("click", function (e) {
      var sl = e.target.closest && e.target.closest(".dc-slide");
      if (!sl) return;
      var idx = all.indexOf(sl);
      if (idx < 0) return;
      /* اگر اسلاید وسط نیست، اول بیاورش وسط و کلیک را نادیده بگیر (کارت کناری = فقط نمایش) */
      if (!sl.classList.contains("is-active")) {
        e.stopPropagation(); e.preventDefault();
        sl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        return;
      }
      /* کپی فعال: کلیک را به کارت واقعی هم‌ارز بده */
      if (sl.getAttribute("data-clone")) {
        var tgt = real[realIndex(idx)];
        var el = tgt && (e.target.closest(".toggle-switch") ? tgt.querySelector(".toggle-switch") : tgt.firstElementChild);
        if (el && el !== e.target) { e.stopPropagation(); e.preventDefault(); el.click(); }
      }
    }, true);

    /* هر تغییر در سوییچ‌ها/متن وضعیت اصلی → کارت‌ها هم‌گام شوند */
    if (window.MutationObserver) {
      var mo = new MutationObserver(sync);
      MAP.forEach(function (m) {
        var a = $(m.src), b = $(m.subSrc);
        if (a) mo.observe(a, { attributes: true, attributeFilter: ["class"] });
        if (b) mo.observe(b, { childList: true, characterData: true, subtree: true });
      });
    }
    sync();
    try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) {}
  }

  /* کارت اصلی (پلن) → مستقیم به «اشتراک و پلن» در تب حساب کاربری */
  function openPlanPage() {
    var nav = document.querySelector('.navbtn[data-tab="profile"]');
    if (!nav) return false;
    nav.click();
    var tries = 0;
    (function step() {
      var row = document.querySelector('.ws-row[data-ws="plan"]');
      var panel = document.getElementById("panel-profile");
      var ready = row && panel && panel.classList.contains("active");
      if (row && (ready || tries >= 14)) { row.click(); return; }
      if (++tries < 16) setTimeout(step, 60);
    })();
    return true;
  }

  function bindPlanCard() {
    var car = $("dashCarousel");
    if (!car) return;
    var card = car.querySelector(".plan-bank-card");
    if (!card || card._planBound) return;
    card._planBound = true;

    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "رفتن به بخش اشتراک و پلن");

    /* اگر کاربر کاروسل را کشیده، کلیک ناخواسته باز نشود */
    var sx = 0, sy = 0, sl = 0, moved = false;
    car.addEventListener("pointerdown", function (e) {
      sx = e.clientX; sy = e.clientY; sl = car.scrollLeft; moved = false;
    }, { passive: true });
    car.addEventListener("pointermove", function (e) {
      if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) moved = true;
    }, { passive: true });
    car.addEventListener("touchstart", function () { moved = false; }, { passive: true });

    card.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".toggle-switch")) return;
      if (moved || Math.abs(car.scrollLeft - sl) > 8) return;
      e.preventDefault();
      openPlanPage();
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        openPlanPage();
      }
    });
  }

  function boot() { bind(); bindPlanCard(); sync(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("load", function () { boot(); setTimeout(boot, 800); setTimeout(sync, 2500); });
  setInterval(sync, 3000);
})();

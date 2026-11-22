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

    /* نقطه‌ها: بر اساس اسلایدی که بیشترین بخش را دارد */
    var dots = $("dashDots") ? $("dashDots").children : [];
    var slides = car.querySelectorAll(".dc-slide");
    function updateDots() {
      var box = car.getBoundingClientRect(), best = 0, bestV = -1;
      for (var i = 0; i < slides.length; i++) {
        var r = slides[i].getBoundingClientRect();
        var v = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
        if (v > bestV) { bestV = v; best = i; }
      }
      for (var j = 0; j < dots.length; j++) dots[j].classList.toggle("on", j === best);
    }
    var raf = 0;
    car.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; updateDots(); });
    }, { passive: true });
    for (var d = 0; d < dots.length; d++) {
      (function (i) {
        dots[i].addEventListener("click", function () {
          if (slides[i]) slides[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      })(d);
    }
    updateDots();

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

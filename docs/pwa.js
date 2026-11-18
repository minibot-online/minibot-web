/* Mini Bot Web — اعلان نصب اپلیکیشن (PWA) */
(function () {
  var KEY = "mb_pwa_dismiss";
  var RESHOW = 14 * 24 * 60 * 60 * 1000; // بعد از ۱۴ روز دوباره پیشنهاد می‌شود
  var box = document.getElementById("pwaPrompt");
  var sub = document.getElementById("pwaSub");
  var okBtn = document.getElementById("pwaInstallBtn");
  var xBtn = document.getElementById("pwaCloseBtn");
  var row = document.getElementById("wsInstallRow");
  var rowSub = document.getElementById("wsInstallSub");
  var hm = document.getElementById("hdrInstallBtn");
  if (!box || !sub || !okBtn || !xBtn) return;

  var deferred = null, shown = false;
  var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);

  function standalone() {
    return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  }
  /* درون اپ اندروید (WebView) هم یعنی نصب‌شده است */
  function inWrapper() {
    var ua = navigator.userAgent || "";
    return /;\s*wv\b/.test(ua) || /MiniBot/i.test(ua);
  }
  function installedFlag() {
    try { return localStorage.getItem("mb_pwa_installed") === "1"; } catch (e) { return false; }
  }
  function isInstalled() {
    return standalone() || inWrapper() || installedFlag();
  }
  function dismissed() {
    var t = 0;
    try { t = +(localStorage.getItem(KEY) || 0); } catch (e) { t = 0; }
    return t > 0 && Date.now() - t < RESHOW;
  }
  function show() {
    if (shown || isInstalled() || dismissed()) return;
    shown = true;
    box.hidden = false;
    if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (e) {} }
  }
  function hide(remember) {
    shown = false;
    box.hidden = true;
    if (remember) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  }
  /* ردیف «نصب اپلیکیشن» در تنظیمات: تا وقتی نصب نشده و امکان نصب هست دیده می‌شود */
  function syncRow() {
    var can = !isInstalled();
    if (hm) hm.hidden = !can;
    if (!row) return;
    row.hidden = !can;
    if (can && rowSub) {
      rowSub.textContent = isiOS
        ? "در سافاری: دکمه اشتراک‌گذاری ← افزودن به صفحه اصلی"
        : "مثل اپلیکیشن روی گوشی نصب شود";
    }
  }
  function tell(msg) {
    try { if (typeof toast === "function") { toast(msg); return; } } catch (e) {}
    try { if (window.toast && typeof window.toast === "function") { window.toast(msg); return; } } catch (e) {}
    try { alert(msg); } catch (e) {}
  }
  async function doInstall() {
    if (deferred) {
      try { deferred.prompt(); await deferred.userChoice; } catch (e) {}
      deferred = null;
      hide(true);
      syncRow();
      return true;
    }
    if (isiOS) { iosHint(); tell("در سافاری: دکمه اشتراک‌گذاری ← افزودن به صفحه اصلی"); return false; }
    tell("برای نصب، از منوی مرورگر «افزودن به صفحه اصلی» را بزن");
    return false;
  }

  function iosHint() {
    sub.textContent = "در سافاری دکمه «اشتراک‌گذاری» را بزن و «افزودن به صفحه اصلی» را انتخاب کن";
    okBtn.hidden = true;
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    show();
    syncRow();
  });
  window.addEventListener("appinstalled", function () {
    try { localStorage.setItem("mb_pwa_installed", "1"); } catch (e) {}
    hide(true);
    deferred = null;
    syncRow();
    if (hm) hm.hidden = true;
    var tip0 = document.getElementById("installTip");
    if (tip0) tip0.hidden = true;
  });

  okBtn.addEventListener("click", function () { doInstall(); });
  xBtn.addEventListener("click", function () { hide(true); });

  if (hm) {
    hm.addEventListener("click", function () { doInstall(); });
  }
  window.__mbInstall = doInstall;

  if (row) {
    row.addEventListener("click", function () { doInstall(); });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doInstall(); }
    });
    syncRow();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) syncRow(); });
  }
  /* ---------- اعلان نصب روی داشبورد: هر بار ورود، با دکمه بستن ---------- */
  (function () {
    var tip = document.getElementById("installTip");
    var main = document.getElementById("installTipMain");
    var xBtn2 = document.getElementById("installTipX");
    var dash = document.getElementById("panel-dashboard");
    if (!tip || !dash) return;

    var closedThisVisit = false, timer = null;

    function showTip() {
      if (closedThisVisit || isInstalled()) { tip.hidden = true; return; }
      tip.hidden = false;
      if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (e) {} }
    }
    function hideTip() { tip.hidden = true; }
    function isDash() { return dash.classList.contains("active"); }

    function schedule() {
      clearTimeout(timer);
      if (!isDash()) { hideTip(); return; }
      timer = setTimeout(showTip, 700);
    }

    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(dash, { attributes: true, attributeFilter: ["class"] });
    }
    /* ورود دوباره به داشبورد → اعلان دوباره می‌آید */
    document.querySelectorAll('.navbtn[data-tab="dashboard"]').forEach(function (b) {
      b.addEventListener("click", function () { closedThisVisit = false; schedule(); });
    });

    if (xBtn2) xBtn2.addEventListener("click", function (e) {
      e.stopPropagation();
      closedThisVisit = true;
      hideTip();
    });
    if (main) main.addEventListener("click", function () { doInstall(); });

    window.addEventListener("appinstalled", function () { closedThisVisit = true; hideTip(); });
    schedule();
  })();


  if (isiOS) {
    okBtn.textContent = "چطور؟";
    if (!isInstalled()) setTimeout(show, 4000);
    syncRow();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();

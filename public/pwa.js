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
  if (!box || !sub || !okBtn || !xBtn) return;

  var deferred = null, shown = false;
  var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);

  function standalone() {
    return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  }
  function dismissed() {
    var t = 0;
    try { t = +(localStorage.getItem(KEY) || 0); } catch (e) { t = 0; }
    return t > 0 && Date.now() - t < RESHOW;
  }
  function show() {
    if (shown || standalone() || dismissed()) return;
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
    if (!row) return;
    var can = !standalone() && (!!deferred || isiOS);
    row.hidden = !can;
    if (can && rowSub) {
      rowSub.textContent = isiOS
        ? "در سافاری: دکمه اشتراک‌گذاری ← افزودن به صفحه اصلی"
        : "مثل اپلیکیشن روی گوشی نصب شود";
    }
  }
  async function doInstall() {
    if (deferred) {
      try { deferred.prompt(); await deferred.userChoice; } catch (e) {}
      deferred = null;
      hide(true);
      syncRow();
      return true;
    }
    iosHint();
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
  window.addEventListener("appinstalled", function () { hide(true); deferred = null; syncRow(); });

  okBtn.addEventListener("click", function () { doInstall(); });
  xBtn.addEventListener("click", function () { hide(true); });

  if (row) {
    row.addEventListener("click", function () { doInstall(); });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doInstall(); }
    });
    syncRow();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) syncRow(); });
  }

  if (isiOS) {
    okBtn.textContent = "چطور؟";
    if (!standalone()) setTimeout(show, 4000);
    syncRow();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();

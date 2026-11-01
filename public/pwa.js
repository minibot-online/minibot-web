/* Mini Bot Web — اعلان نصب اپلیکیشن (PWA) */
(function () {
  var KEY = "mb_pwa_dismiss";
  var RESHOW = 14 * 24 * 60 * 60 * 1000; // بعد از ۱۴ روز دوباره پیشنهاد می‌شود
  var box = document.getElementById("pwaPrompt");
  var sub = document.getElementById("pwaSub");
  var okBtn = document.getElementById("pwaInstallBtn");
  var xBtn = document.getElementById("pwaCloseBtn");
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
  function iosHint() {
    sub.textContent = "در سافاری دکمه «اشتراک‌گذاری» را بزن و «افزودن به صفحه اصلی» را انتخاب کن";
    okBtn.hidden = true;
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    show();
  });
  window.addEventListener("appinstalled", function () { hide(true); });

  okBtn.addEventListener("click", async function () {
    if (deferred) {
      try { deferred.prompt(); await deferred.userChoice; } catch (e) {}
      deferred = null;
      hide(true);
      return;
    }
    iosHint();
  });
  xBtn.addEventListener("click", function () { hide(true); });

  if (isiOS) {
    okBtn.textContent = "چطور؟";
    if (!standalone()) setTimeout(show, 4000);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();

/* بازگشت از صفحه اتصال — هم با فلش بالای طرح، هم با دکمه بازگشت گوشی
   صفحه اتصال یک لایه‌ی تمام‌صفحه (iframe) روی پنل است. بدون این فایل، فلش طرح
   هیچ کاری نمی‌کرد (history.back داخل خود iframe اجرا می‌شد) و دکمه‌ی بازگشت
   گوشی کل سایت را می‌بست. اینجا هنگام باز شدن صفحه یک ورودی تاریخچه می‌گذاریم
   و با دکمه‌ی بازگشت گوشی همان صفحه بسته می‌شود، نه سایت. */
(function () {
  var pushed = false;

  function el(id) { return document.getElementById(id); }

  function isOpen() {
    var s = el("screenOnboarding");
    if (!s) return false;
    var d = s.style.display;
    if (d) return d !== "none";
    try { return getComputedStyle(s).display !== "none"; } catch (e) { return false; }
  }

  function closeOverlay() {
    var x = el("onbCloseBtn");
    if (x) { try { x.click(); return; } catch (e) {} }
    var s = el("screenOnboarding");
    if (s) s.style.display = "none";
  }

  function pushState() {
    if (pushed || !isOpen()) return;
    try { history.pushState({ mbOnb: 1 }, ""); pushed = true; }
    catch (e) { pushed = false; }
  }

  /* بستن از سمت خود پنل: ورودی تاریخچه‌ی خودمان را برمی‌داریم تا بازگشت بعدی
     سایت را نبندد */
  function dropState() {
    if (!pushed) return;
    pushed = false;
    try { history.back(); } catch (e) {}
  }

  function watch() {
    var s = el("screenOnboarding");
    if (!s) return;
    if (isOpen()) pushState();
    if (!window.MutationObserver) return;
    new MutationObserver(function () {
      if (isOpen()) pushState();
      else dropState();
    }).observe(s, { attributes: true, attributeFilter: ["style", "class"] });
  }

  /* اگر داخل طرح چیزی باز باشد (کشوی کشور، مودال QR، صفحه کد) اول همان بسته شود */
  function closeInner() {
    var f = el("connectFrame");
    try {
      var w = f && f.contentWindow;
      if (w && typeof w.mbBackInner === "function") return w.mbBackInner() === true;
    } catch (e) {}
    return false;
  }

  /* دکمه‌ی بازگشت گوشی (و دکمه‌ی بازگشت مرورگر) */
  window.addEventListener("popstate", function () {
    if (!pushed || !isOpen()) return;
    if (closeInner()) { pushed = false; pushState(); return; }
    pushed = false;
    closeOverlay();
  });

  /* فلش بازگشت داخل طرح صفحه اتصال */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.__mb !== 1 || d.t !== "back") return;
    if (isOpen()) closeOverlay();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();
})();

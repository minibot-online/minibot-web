/* پنل: طرح صفحه اتصال را داخل iframe نشان می‌دهد و به منطق واقعی اتصال وصل می‌کند */
(function () {
  function byId(id) { return document.getElementById(id); }
  var frame, phone, btn, codeBox, codeText, errBox, lastCode = "", lastErr = "";

  function send(m) {
    if (!frame || !frame.contentWindow) return;
    m.__mb = 1;
    try { frame.contentWindow.postMessage(m, location.origin); } catch (e) {}
  }

  /* ارتفاع نوار پایین گوشی (safe-area) — داخل iframe صفر است، پس از پنل می‌فرستیم */
  function safeBottom() {
    var d = document.createElement("div");
    d.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(d);
    var h = d.offsetHeight || 0;
    d.parentNode.removeChild(d);
    return h;
  }
  function sendSafe() { send({ t: "safe", bottom: safeBottom() }); }

  /* کد QR را تا آماده شدن (و برای تازه‌سازی دوره‌ای) چند بار می‌پرسیم */
  var qrTimer = null, lastQr = "";
  function qrPoll(n) {
    if (qrTimer) { clearTimeout(qrTimer); qrTimer = null; }
    fetch("/api/status").then(function (r) { return r.json(); }).then(function (s) {
      var src = s.qrImage || (s.qr ? "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=" + encodeURIComponent(s.qr) : "");
      if (src && src !== lastQr) { lastQr = src; send({ t: "qrData", src: src }); }
    }).catch(function () {}).then(function () {
      if (n < 15) qrTimer = setTimeout(function () { qrPoll(n + 1); }, 4000);
    });
  }

  function wire() {
    frame = byId("connectFrame");
    phone = byId("onbPairPhone");
    btn = byId("onbPairBtn");
    codeBox = byId("onbPairCode");
    codeText = byId("onbPairCodeText");
    errBox = byId("onbPairErr");
    if (!frame || !btn || frame.dataset.wired) return;
    frame.dataset.wired = "1";

    frame.addEventListener("load", function () { send({ t: "ready" }); sendSafe(); });

    function pushCode() {
      var c = (codeText && codeText.textContent || "").trim();
      if (c && c !== "----" && c !== lastCode) {
        lastCode = c;
        send({ t: "code", code: c, phone: (phone && phone.value) || "" });
      }
    }
    function pushErr() {
      if (!errBox || errBox.style.display === "none") return;
      var m = (errBox.textContent || "").trim();
      if (m && m !== lastErr) { lastErr = m; send({ t: "error", msg: m }); }
    }
    if (codeText) new MutationObserver(pushCode).observe(codeText, { childList: true, characterData: true, subtree: true });
    if (errBox) new MutationObserver(pushErr).observe(errBox, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["style"] });

    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || !d.__mb) return;
      if (d.t === "ready") {
        sendSafe();
      } else if (d.t === "pair") {
        var v = String(d.phone || "").replace(/\D/g, "");
        lastCode = ""; lastErr = "";
        if (phone) phone.value = v;
        if (errBox) errBox.style.display = "none";
        btn.click();
      } else if (d.t === "qr") {
        sendSafe();
        qrPoll(0);
      } else if (d.t === "phone") {
        var tab = document.querySelector('#onbToggle .onb-tab[data-mode="pair"]');
        if (tab) tab.click();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();

/* Mini Bot — جستجوی فیش‌ها (کاملاً سمت پنل، بدون تغییر سرور)
   کل فیش‌ها یک‌جا از همان مسیر موجود /api/receipts خوانده می‌شود و در حافظه‌ی مرورگر
   فیلتر می‌شود؛ لیست اصلی پنل دست‌نخورده می‌ماند و نتایج در ظرف جداگانه نشان داده می‌شود. */
(function () {
  var input = document.getElementById("receiptSearch");
  var appList = document.getElementById("receiptsList");
  if (!input || !appList) return;

  var clearBtn = document.getElementById("receiptSearchClear");
  var info = document.getElementById("receiptSearchInfo");
  var wrap = document.getElementById("rcpSearchWrap");

  var results = document.createElement("div");
  results.className = "receipt-list";
  results.id = "receiptResults";
  results.hidden = true;
  appList.parentNode.insertBefore(results, appList.nextSibling);

  var all = null;        /* آرایه‌ی فیش‌ها */
  var stale = false;     /* لیست پنل عوض شده → دفعه‌ی بعد دوباره بخوان */
  var loading = null;    /* Promise در جریان */
  var query = "";
  var limit = 50;
  var PAGE = 50;

  /* ---------- ابزار ---------- */
  function fa(n) { return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }

  function norm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String("٠١٢٣٤٥٦٧٨٩".indexOf(d)); })
      .replace(/[\u200c\u200e\u200f\u064b-\u0652]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function bare(s) { return s.replace(/[^0-9a-z\u0600-\u06FF]/g, ""); }

  function jalali(ts) {
    try {
      var d = new Date(ts);
      var f = new Intl.DateTimeFormat("fa-IR", {
        calendar: "persian", year: "numeric", month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
      return f.format(d).replace("،", ",");
    } catch (e) { return ""; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* همه‌ی مقدارهای فیش در یک رشته، برای جستجو */
  function haystack(r) {
    if (r.__hay) return r.__hay;
    var d = r.data || {}, parts = [];
    parts.push(r.sender, r.source === "pdf" ? "pdf" : "عکس");
    for (var k in d) { if (d.hasOwnProperty(k)) parts.push(d[k]); }
    parts.push(jalali(r.timestamp));
    var h = norm(parts.join(" | "));
    r.__hay = h;
    r.__hayBare = bare(h);
    return h;
  }

  /* ---------- خواندن فیش‌ها ---------- */
  function load() {
    if (all) return Promise.resolve(all);
    if (loading) return loading;
    loading = fetch("/api/receipts", { credentials: "include" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        all = (j && j.receipts) || [];
        return all;
      })
      .catch(function () { all = []; return all; })
      .then(function (a) { loading = null; return a; });
    return loading;
  }

  /* ---------- کارت نتیجه ---------- */
  function cell(label, value, mono, wide) {
    if (!value) return "";
    return '<div class="rc-cell' + (wide ? " rc-wide" : "") + (mono ? " rc-mono" : "") +
      '"><span class="label">' + esc(label) + '</span><span class="value">' + esc(value) + "</span></div>";
  }

  function card(r) {
    var d = r.data || {};
    var when = jalali(r.timestamp);
    return '<div class="receipt-item" data-id="' + esc(r.id) + '">' +
      '<div class="rc-top"><div class="rc-amount"><span class="label">مبلغ</span>' +
      '<span class="amount">' + esc(d.amount || "—") + "</span></div></div>" +
      '<div class="rc-grid">' +
      cell("تاریخ فیش", d.date, false, true) +
      cell("فرستنده", d.senderName) +
      cell("گیرنده", d.receiverName) +
      cell("شماره پیگیری", d.trackingNo, true) +
      cell("IBAN فرستنده", d.senderIban, true) +
      cell("IBAN گیرنده", d.receiverIban, true) +
      cell("کد مرجع", d.refCode, true, true) +
      "</div>" +
      '<div class="sender-info"><span class="source-badge ' +
      (r.source === "pdf" ? "source-pdf" : "source-image") + '">' +
      (r.source === "pdf" ? "PDF" : "عکس") + "</span>" +
      '<span class="rc-meta">فرستاده شده توسط <b>' + esc(r.sender || "") + "</b>" +
      (when ? " — " + esc(when) : "") + "</span></div></div>";
  }

  /* ---------- فیلتر و نمایش ---------- */
  function matches(q) {
    var qBare = bare(q);
    var words = q.split(" ").filter(function (w) { return bare(w); });
    return (all || []).filter(function (r) {
      var h = haystack(r);
      if (h.indexOf(q) >= 0) return true;
      if (!qBare) return false;
      if (r.__hayBare.indexOf(qBare) >= 0) return true;
      for (var i = 0; i < words.length; i++) {
        if (h.indexOf(words[i]) < 0) return false;
      }
      return words.length > 0;
    });
  }

  function render() {
    var q = query;
    if (q && (!all || stale)) {
      stale = false;
      all = null;
      if (info) { info.hidden = false; info.classList.remove("empty"); info.textContent = "در حال آماده‌سازی فیش‌ها…"; }
      load().then(function () { if (query) render(); });
      return;
    }
    if (!q) {
      results.hidden = true;
      results.innerHTML = "";
      appList.hidden = false;
      if (info) { info.hidden = true; info.textContent = ""; }
      if (wrap) wrap.classList.remove("has-q");
      return;
    }
    var hits = matches(q);
    var slice = hits.slice(0, limit);
    var html = "";
    for (var i = 0; i < slice.length; i++) html += card(slice[i]);
    if (hits.length > slice.length) {
      html += '<button type="button" class="btn btn-secondary btn-sm load-more" id="rcpMore">' +
        "نمایش بیشتر (" + fa(hits.length - slice.length) + " فیش دیگر)</button>";
    }
    results.innerHTML = html;
    results.hidden = false;
    appList.hidden = true;
    if (wrap) wrap.classList.add("has-q");
    if (info) {
      info.hidden = false;
      info.classList.toggle("empty", !hits.length);
      info.textContent = hits.length
        ? fa(hits.length) + " فیش پیدا شد" + (hits.length > slice.length ? " — " + fa(slice.length) + " مورد نمایش داده شده" : "")
        : "فیشی با این مشخصات پیدا نشد";
    }
    var more = document.getElementById("rcpMore");
    if (more) more.addEventListener("click", function () { limit += PAGE; render(); });
  }

  var t = null;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(function () {
      query = norm(input.value);
      limit = PAGE;
      render();
    }, 140);
  }

  input.addEventListener("input", schedule);
  input.addEventListener("search", schedule);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { input.value = ""; schedule(); }
  });
  if (clearBtn) clearBtn.addEventListener("click", function () {
    input.value = ""; query = ""; render(); input.focus();
  });

  /* فیش‌ها با اولین جستجو خوانده می‌شوند (برای صرفه‌جویی در داده) */
  /* اگر سرور لیست را عوض کرد (فیش جدید یا حذف)، دفعه‌ی بعد تازه بخوان */
  var lastSig = "";
  function sig() {
    var items = appList.querySelectorAll(".receipt-item");
    return items.length + ":" + (items[0] ? items[0].dataset.id : "");
  }
  lastSig = sig();
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      var s = sig();
      if (s !== lastSig) { lastSig = s; stale = true; }
    }, 500);
  }).observe(appList, { childList: true });
})();

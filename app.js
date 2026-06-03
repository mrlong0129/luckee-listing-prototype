/* ============================================================
   Luckee Listing — shared helpers (vanilla JS, no build)
   Exposed as window.Luckee
   ============================================================ */
(function () {
  const L = {};

  /* ---- escape ---- */
  L.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* ---- word-level diff (LCS) ---- */
  function tokenize(str) {
    // keep words and whitespace as separate tokens so spacing is preserved
    return String(str).match(/\s+|[^\s]+/g) || [];
  }
  function lcs(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { ops.push({ t: "eq", v: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: "del", v: a[i] }); i++; }
      else { ops.push({ t: "add", v: b[j] }); j++; }
    }
    while (i < m) { ops.push({ t: "del", v: a[i++] }); }
    while (j < n) { ops.push({ t: "add", v: b[j++] }); }
    return ops;
  }
  L.diffOps = function (oldS, newS) { return lcs(tokenize(oldS), tokenize(newS)); };

  // Current pane: original text with deletions struck through
  L.diffCurrent = function (oldS, newS) {
    return L.diffOps(oldS, newS).filter(o => o.t !== "add")
      .map(o => o.t === "del" ? `<span class="diff-del">${L.esc(o.v)}</span>` : L.esc(o.v)).join("");
  };
  // Suggested pane: new text with additions highlighted
  L.diffSuggested = function (oldS, newS) {
    return L.diffOps(oldS, newS).filter(o => o.t !== "del")
      .map(o => o.t === "add" ? `<span class="diff-add">${L.esc(o.v)}</span>` : L.esc(o.v)).join("");
  };

  /* ---- chips ---- */
  const SUPPORT = { CLEAR: "chip-clear", PARTIAL: "chip-partial", UNKNOWN: "chip-unknown", CONFLICT: "chip-conflict" };
  L.supportChip = function (s) { return `<span class="chip ${SUPPORT[s] || "chip-unknown"}"><span class="dot"></span>${L.esc(s)}</span>`; };
  L.riskChip = function (r) {
    const m = { HIGH: "risk-high", MEDIUM: "risk-med", MED: "risk-med", LOW: "risk-low" };
    return `<span class="chip ${m[r] || "chip-unknown"}">${L.esc(r === "MEDIUM" ? "MED" : r)}</span>`;
  };
  L.prioChip = function (p) {
    const m = { P0: "prio-p0", P1: "prio-p1", P2: "prio-p2" };
    return `<span class="chip prio ${m[p] || "prio-p2"}">${L.esc(p)}</span>`;
  };
  // module coverage status (benchmark / suggest modules)
  L.statusChip = function (s) {
    if (s === "available") return `<span class="chip chip-clear"><span class="dot"></span>Covered</span>`;
    if (s === "partial") return `<span class="chip chip-partial"><span class="dot"></span>Partial</span>`;
    return `<span class="chip chip-conflict"><span class="dot"></span>Missing</span>`;
  };
  L.coverIcon = function (s) {
    if (s === "available") return `<span style="color:var(--success-600);font-weight:700">●</span>`;
    if (s === "partial") return `<span style="color:var(--warning-600);font-weight:700">◐</span>`;
    return `<span style="color:var(--error-600);font-weight:700">○</span>`;
  };

  /* ---- shared chrome ---- */
  L.topNav = function (active) {
    const link = (href, label) => `<a href="${href}"${active === label ? ' style="color:var(--forest-600)"' : ""}>${label}</a>`;
    return `
    <nav class="nav"><div class="container nav-inner">
      <a class="brand" href="index.html"><span class="mark">L</span>Luckee <span style="color:var(--muted);font-weight:400">Listing</span></a>
      <div class="nav-links">
        ${link("index.html#how", "How it works")}
        ${link("index.html#why", "Why")}
        ${link("index.html#pricing", "Pricing")}
        <a href="#" style="color:var(--muted)">Sign in</a>
      </div>
      <a class="btn btn-primary btn-sm" href="audit.html" aria-label="Audit my listing — free"><span class="cta-full">Audit my listing — free</span><span class="cta-short">Free audit</span></a>
    </div></nav>`;
  };

  L.appBar = function (step) {
    // step: 'audit' | 'report' | 'workspace' — kept only to pick the right CTA
    return `
    <header class="appbar"><div class="container nav-inner">
      <a class="brand" href="index.html" style="font-size:1.15rem"><span class="mark" style="width:26px;height:26px;font-size:1rem">L</span>Luckee Listing</a>
      <div class="row" style="gap:10px">
        ${step === "report"
          ? `<a class="btn btn-primary btn-sm" href="workspace.html">Open workspace →</a>`
          : step === "workspace"
            ? `<a class="btn btn-outline btn-sm" href="report.html">← Back to report</a>`
            : `<a class="btn btn-outline btn-sm" href="index.html">Cancel</a>`}
      </div>
    </div></header>`;
  };

  L.footer = function () {
    return `
    <footer class="footer grain"><div class="container" style="padding:64px 28px 40px;position:relative;z-index:1">
      <div class="row-between wrap" style="align-items:flex-end;gap:32px">
        <div style="max-width:420px">
          <div class="brand" style="color:var(--oat-100)"><span class="mark">L</span>Luckee Listing</div>
          <h2 style="color:var(--oat-100);margin:18px 0 10px;font-size:2rem">Audit your listing before your shoppers do.</h2>
          <p class="muted" style="color:var(--forest-300)">In-platform SEO → GEO. Make your listing answer what Alexa for Shopping and shoppers ask — and lift CVR.</p>
          <a class="btn btn-on-dark" href="audit.html" style="margin-top:8px">Run a free audit →</a>
        </div>
        <div class="row wrap" style="gap:56px;align-items:flex-start;font-size:.88rem">
          <div class="stack" style="--gap:10px"><strong style="color:var(--oat-100)">Product</strong><a href="index.html#how">How it works</a><a href="index.html#why">Why Luckee</a><a href="index.html#pricing">Pricing</a></div>
          <div class="stack" style="--gap:10px"><strong style="color:var(--oat-100)">Company</strong><a href="#">About</a><a href="#">Blog</a><a href="#">Contact</a></div>
        </div>
      </div>
      <hr class="hr" style="background:rgba(255,255,255,.1);margin:40px 0 18px">
      <div class="row-between wrap muted" style="color:var(--forest-300);font-size:.8rem">
        <span>© 2026 Luckee. Listing optimization for the AI buying era.</span>
        <span>Evidence-gated · brand-aware · never invents</span>
      </div>
    </div></footer>`;
  };

  /* ---- load stagger ---- */
  L.initReveal = function (root) {
    const els = (root || document).querySelectorAll("[data-reveal]");
    els.forEach((el, i) => { el.classList.add("reveal"); el.style.animationDelay = (i * 70) + "ms"; });
  };

  /* ---- simple tab controller ----
     usage: data-tab-group="x" on buttons (data-tab="key") and panels (data-panel="key") */
  L.initTabs = function () {
    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.closest("[data-tabs]") || document;
        group.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("tab-active", b === btn));
        const key = btn.getAttribute("data-tab");
        document.querySelectorAll("[data-panel]").forEach(p => {
          p.style.display = p.getAttribute("data-panel") === key ? "" : "none";
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  };

  window.Luckee = L;
  document.addEventListener("DOMContentLoaded", () => { L.initReveal(); });
})();

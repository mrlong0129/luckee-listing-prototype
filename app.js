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
  L.topNav = function () {
    return `
    <nav class="nav"><div class="container nav-inner">
      <a class="brand" href="index.html"><span class="mark">L</span>Luckee <span style="color:var(--muted);font-weight:400">Listing</span></a>
      <div class="nav-actions">
        <span data-account-slot></span>
        <a class="btn btn-primary btn-sm" href="audit.html" aria-label="Get my free audit" data-nav-free-audit><span class="cta-full" aria-hidden="true">Get my free audit</span><span class="cta-short" aria-hidden="true">Free audit</span></a>
      </div>
    </div></nav>`;
  };

  L.appBar = function (step) {
    // step: 'audit' | 'report' | 'workspace' — kept only to pick the right CTA
    return `
    <header class="appbar"><div class="container nav-inner">
      <a class="brand" href="index.html" style="font-size:1.15rem"><span class="mark" style="width:26px;height:26px;font-size:1rem">L</span>Luckee Listing</a>
      <div class="row app-actions" style="gap:10px">
        ${step === "report"
          ? `<a class="btn btn-primary btn-sm" href="workspace.html" data-credit-action="optimize">Generate fixes →</a>`
          : step === "workspace"
            ? `<a class="btn btn-outline btn-sm" href="report.html">← Back to report</a>`
            : `<a class="btn btn-outline btn-sm" href="index.html">Cancel</a>`}
        <span data-account-slot></span>
      </div>
    </div></header>`;
  };

  L.footer = function () {
    return `
    <footer class="footer grain"><div class="container footer-compact">
      <div class="footer-grid">
        <div class="footer-lede">
          <div class="brand footer-brand"><span class="mark">L</span>Luckee Listing</div>
          <h2>Find what your listing still cannot answer.</h2>
          <p>Amazon listing answerability: buyer questions, evidence gaps and field-level fixes in one audit.</p>
        </div>
        <div class="footer-nav">
          <strong>Product</strong>
          <a href="index.html#why">Why Luckee</a>
          <a href="index.html#how">Workflow</a>
          <a href="index.html#workspace">Workspace</a>
          <a href="index.html#pricing">Pricing</a>
        </div>
        <div class="footer-nav">
          <strong>Prototype</strong>
          <a href="audit.html">Audit flow</a>
          <a href="report.html">Sample report</a>
          <a href="workspace.html">Workspace demo</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Luckee. Listing optimization for the AI buying era.</span>
        <span>Evidence-gated · brand-aware · never invents</span>
      </div>
    </div></footer>`;
  };

  /* ---- prototype funnel state ----
     Production should replace this with Luckee 1.0 account, usage and credit APIs. */
  const FUNNEL_KEY = "luckee-listing-funnel-v1";
  const FUNNEL_DEFAULT = {
    signedIn: false,
    authMode: "guest",
    accountName: "",
    accountEmail: "",
    freeAuditUsed: false,
    freeOptimizationUsed: false,
    auditRuns: 0,
    optimizationRuns: 0
  };

  function readFunnelState() {
    try {
      const raw = window.localStorage && window.localStorage.getItem(FUNNEL_KEY);
      return Object.assign({}, FUNNEL_DEFAULT, raw ? JSON.parse(raw) : {});
    } catch (err) {
      return Object.assign({}, FUNNEL_DEFAULT);
    }
  }

  function writeFunnelState(next) {
    const state = Object.assign({}, FUNNEL_DEFAULT, next || {});
    try {
      if (window.localStorage) window.localStorage.setItem(FUNNEL_KEY, JSON.stringify(state));
    } catch (err) {
      // localStorage can be blocked in private browsing; keep the prototype usable.
    }
    return state;
  }

  function defaultAccount() {
    const D = window.LUCKEE_DATA || {};
    const account = (D.funnel && D.funnel.account) || {};
    return {
      accountName: account.name || "Luckee user",
      accountEmail: account.email || "demo@luckee.ai"
    };
  }

  L.funnel = {
    getState: readFunnelState,
    setState: writeFunnelState,
    update(patch) {
      const state = writeFunnelState(Object.assign({}, readFunnelState(), patch || {}));
      L.refreshFunnelStrips();
      if (typeof L.refreshAccountSlots === "function") L.refreshAccountSlots();
      if (typeof L.refreshPricing === "function") L.refreshPricing();
      return state;
    },
    reset() {
      try {
        if (window.localStorage) window.localStorage.removeItem(FUNNEL_KEY);
      } catch (err) {}
      L.refreshFunnelStrips();
      if (typeof L.refreshAccountSlots === "function") L.refreshAccountSlots();
      if (typeof L.refreshPricing === "function") L.refreshPricing();
      return Object.assign({}, FUNNEL_DEFAULT);
    },
    markSignedIn(mode) {
      return this.update(Object.assign({
        signedIn: true,
        authMode: mode || "login"
      }, defaultAccount()));
    },
    markSignedOut() {
      return this.update({
        signedIn: false,
        authMode: "guest",
        accountName: "",
        accountEmail: ""
      });
    },
    markAuditViewed() {
      const state = readFunnelState();
      return this.update(Object.assign({
        signedIn: true,
        authMode: state.authMode === "guest" ? "register" : state.authMode,
        freeAuditUsed: true,
        auditRuns: state.freeAuditUsed ? state.auditRuns : state.auditRuns + 1
      }, defaultAccount()));
    },
    markOptimizationGenerated() {
      const state = readFunnelState();
      return this.update(Object.assign({
        signedIn: true,
        authMode: state.authMode === "guest" ? "register" : state.authMode,
        freeOptimizationUsed: true,
        optimizationRuns: state.freeOptimizationUsed ? state.optimizationRuns : state.optimizationRuns + 1
      }, defaultAccount()));
    }
  };

  L.syncFunnelFromUrl = function () {
    const params = new URLSearchParams(window.location.search || "");
    const authParam = params.get("auth");
    if (params.get("reset") === "1") L.funnel.reset();
    if (authParam && !L.funnel.getState().signedIn) {
      const mode = authParam === "register" || authParam === "google" ? authParam : "login";
      L.funnel.markSignedIn(mode);
    }
    if (params.get("audit") === "free") L.funnel.markAuditViewed();
    if (params.get("opt") === "1") L.funnel.markOptimizationGenerated();
  };

  L.funnelStrip = function (context) {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const trial = F.trial || {};
    const state = L.funnel.getState();
    const isWorkspace = context === "workspace";
    const title = isWorkspace
      ? "Optimization bundle generated"
      : (state.signedIn ? "Free loop attached to your Luckee account" : "First complete loop is free");
    const body = isWorkspace
      ? "This generation used the free optimization bundle. Editing, approving and exporting this bundle do not cost extra."
      : (trial.noCardCopy || "No card needed for the first loop. Later runs use Luckee credits.");
    const account = state.signedIn ? (state.accountEmail || defaultAccount().accountEmail) : "Account step pending";
    const audit = state.freeAuditUsed ? "Free audit used" : (trial.auditLabel || "1 free audit report");
    const opt = state.freeOptimizationUsed ? "Optimization used" : (trial.optimizationLabel || "1 free optimization bundle");
    const optClass = state.freeOptimizationUsed ? "spent" : "available";
    return `
      <div class="funnel-strip" data-funnel-strip="${L.esc(context || "default")}">
        <div class="funnel-main">
          <span class="funnel-kicker">Luckee 1.0 account · credits</span>
          <strong>${L.esc(title)}</strong>
          <span>${L.esc(body)}</span>
        </div>
        <div class="funnel-ledger" aria-label="Prototype account and credit state">
          <span class="ledger-pill">${L.esc(account)}</span>
          <span class="ledger-pill ${state.freeAuditUsed ? "spent" : "available"}">${L.esc(audit)}</span>
          <span class="ledger-pill ${optClass}">${L.esc(opt)}</span>
          ${state.signedIn ? '' : '<button class="ledger-action" type="button" data-auth-action="register">Sign up</button><button class="ledger-action ghost" type="button" data-auth-action="login">Sign in</button>'}
        </div>
      </div>`;
  };

  L.refreshFunnelStrips = function () {
    document.querySelectorAll("[data-funnel-slot]").forEach(slot => {
      slot.innerHTML = L.funnelStrip(slot.getAttribute("data-funnel-slot") || "default");
    });
    L.wireAuthActions();
  };

  L.accountWidget = function () {
    const D = window.LUCKEE_DATA || {};
    const accountCopy = (D.funnel && D.funnel.account) || {};
    const state = L.funnel.getState();
    if (!state.signedIn) {
      return `
        <div class="account-auth">
          <button class="btn btn-ghost btn-sm" type="button" data-auth-action="login">Sign in</button>
          <button class="btn btn-outline btn-sm" type="button" data-auth-action="register">Sign up</button>
        </div>`;
    }
    const name = state.accountName || accountCopy.name || "Luckee user";
    const email = state.accountEmail || accountCopy.email || "demo@luckee.ai";
    const credit = accountCopy.creditsValue || "Shared credits";
    return `
      <div class="account-pill" title="Shared with Luckee 1.0 user management and credit subscription">
        <span class="account-avatar">${L.esc(name.slice(0, 1).toUpperCase())}</span>
        <span class="account-copy"><b>${L.esc(name)}</b><em>${L.esc(credit)}</em></span>
        <button class="account-signout" type="button" data-auth-action="signout">Sign out</button>
      </div>`;
  };

  L.refreshAccountSlots = function () {
    document.querySelectorAll("[data-account-slot]").forEach(slot => {
      slot.innerHTML = L.accountWidget();
    });
    L.refreshNavCtas();
    L.wireAuthActions();
  };

  L.refreshNavCtas = function () {
    const state = L.funnel.getState();
    document.querySelectorAll("[data-nav-free-audit]").forEach(cta => {
      const signedIn = !!state.signedIn;
      cta.hidden = signedIn;
      cta.style.display = signedIn ? "none" : "";
      cta.setAttribute("aria-hidden", signedIn ? "true" : "false");
    });
  };

  function addParam(href, key, value) {
    const url = new URL(href, window.location.href);
    url.searchParams.set(key, value);
    return url.pathname.split("/").pop() + url.search + url.hash;
  }

  L.showAuthModal = function (opts) {
    const D = window.LUCKEE_DATA || {};
    const auth = (D.funnel && D.funnel.auth) || {};
    const options = Object.assign({ mode: "register", onSuccess: null }, opts || {});
    const old = document.getElementById("auth-modal-overlay");
    if (old) old.remove();
    const mode = options.mode === "login" ? "login" : "register";
    const overlay = document.createElement("div");
    overlay.className = "funnel-modal-overlay open";
    overlay.id = "auth-modal-overlay";
    overlay.innerHTML = `
      <div class="auth-modal card card-pad-lg" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="funnel-modal-close" type="button" aria-label="Close dialog">×</button>
        <div class="auth-logo">L</div>
        <h2 id="auth-title">${L.esc(auth.title || "Welcome to Luckee")}</h2>
        <p>${L.esc(auth.subtitle || "AI E-commerce helper, making operations easier")}</p>
        <button class="auth-google" type="button" data-auth-success="google">
          <span class="google-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
          </span>
          Continue with Google
        </button>
        <div class="auth-divider"><span>or use email</span></div>
        <div class="auth-tabs" role="tablist" aria-label="Luckee account">
          <button type="button" role="tab" data-auth-tab="login">${L.esc(auth.loginTab || "Login")}</button>
          <button type="button" role="tab" data-auth-tab="register">${L.esc(auth.registerTab || "Sign up")}</button>
        </div>
        <div class="auth-panel" data-auth-panel="login">
          <label>Username/Email<input class="input" type="text" placeholder="Username/Email" value="${L.esc(defaultAccount().accountEmail)}"></label>
          <label>Password<input class="input" type="password" placeholder="Password" value="prototype"></label>
          <div class="auth-row"><a href="https://luckee.ai/login" target="_blank" rel="noreferrer">Forgot password?</a></div>
          <button class="btn btn-primary btn-block" type="button" data-auth-success="login">${L.esc(auth.loginSubmit || "SIGN IN")}</button>
          <p class="auth-legal">${L.esc(auth.legalLogin || "By logging in, you agree to our Terms of Service and Privacy Policy")}</p>
        </div>
        <div class="auth-panel" data-auth-panel="register">
          <label>Email<span class="auth-inline"><input class="input" type="email" placeholder="Enter your email" value="${L.esc(defaultAccount().accountEmail)}"><button class="btn btn-outline btn-sm" type="button">Send</button></span></label>
          <div class="auth-grid">
            <label>Code<input class="input" type="text" placeholder="Enter code" value="000000"></label>
            <label>Username<input class="input" type="text" placeholder="Username" value="${L.esc(defaultAccount().accountName)}"></label>
            <label>Password<input class="input" type="password" placeholder="Password" value="prototype"></label>
            <label>Confirm<input class="input" type="password" placeholder="Repeat password" value="prototype"></label>
          </div>
          <button class="btn btn-primary btn-block" type="button" data-auth-success="register">${L.esc(auth.registerSubmit || "SIGN UP")}</button>
          <p class="auth-legal">${L.esc(auth.legalRegister || "By signing up, you agree to our Terms of Service and Privacy Policy")}</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    function setMode(next) {
      overlay.querySelectorAll("[data-auth-tab]").forEach(btn => {
        const active = btn.getAttribute("data-auth-tab") === next;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      overlay.querySelectorAll("[data-auth-panel]").forEach(panel => {
        panel.hidden = panel.getAttribute("data-auth-panel") !== next;
      });
    }
    setMode(mode);
    overlay.querySelectorAll("[data-auth-tab]").forEach(btn => {
      btn.addEventListener("click", () => setMode(btn.getAttribute("data-auth-tab")));
    });
    overlay.querySelectorAll("[data-auth-success]").forEach(btn => {
      btn.addEventListener("click", () => {
        const authMode = btn.getAttribute("data-auth-success");
        L.funnel.markSignedIn(authMode);
        close();
        if (typeof options.onSuccess === "function") options.onSuccess(authMode);
      });
    });
    overlay.querySelector(".funnel-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector("[data-auth-tab].is-active").focus();
  };

  L.wireAuthActions = function () {
    document.querySelectorAll("[data-auth-action]").forEach(el => {
      if (el.dataset.authBound === "1") return;
      el.dataset.authBound = "1";
      el.addEventListener("click", e => {
        e.preventDefault();
        const action = el.getAttribute("data-auth-action");
        if (action === "signout") {
          L.funnel.markSignedOut();
          L.refreshAccountSlots();
          L.refreshFunnelStrips();
          return;
        }
        L.showAuthModal({ mode: action === "login" ? "login" : "register" });
      });
    });
  };

  L.showFunnelModal = function (opts) {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const options = Object.assign({
      eyebrow: "",
      title: "",
      body: "",
      cost: "",
      footnote: "",
      primary: "Continue",
      secondary: "",
      onConfirm: null
    }, opts || {});
    const old = document.getElementById("funnel-modal-overlay");
    if (old) old.remove();
    const overlay = document.createElement("div");
    overlay.className = "funnel-modal-overlay open";
    overlay.id = "funnel-modal-overlay";
    overlay.innerHTML = `
      <div class="funnel-modal card card-pad-lg" role="dialog" aria-modal="true" aria-labelledby="funnel-modal-title">
        <button class="funnel-modal-close" type="button" aria-label="Close dialog">×</button>
        <span class="eyebrow">${L.esc(options.eyebrow || "Credit checkpoint")}</span>
        <h2 id="funnel-modal-title">${L.esc(options.title)}</h2>
        <p>${L.esc(options.body)}</p>
        ${options.cost ? `<div class="credit-cost"><span>${L.esc(options.cost)}</span></div>` : ""}
        ${options.footnote ? `<p class="credit-foot">${L.esc(options.footnote)}</p>` : ""}
        <div class="funnel-modal-actions">
          <button class="btn btn-primary" type="button" data-confirm>${L.esc(options.primary)}</button>
          <button class="btn btn-ghost" type="button" data-cancel>${L.esc(options.secondary || F.optimizationConfirm?.cancel || "Cancel")}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector("[data-cancel]").addEventListener("click", close);
    overlay.querySelector(".funnel-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector("[data-confirm]").addEventListener("click", () => {
      close();
      if (typeof options.onConfirm === "function") options.onConfirm();
    });
    overlay.querySelector("[data-confirm]").focus();
  };

  L.wireOptimizationCreditLinks = function () {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const gate = F.reportGate || {};
    const confirm = F.optimizationConfirm || {};
    const paywall = F.paywall || {};

    function continueToOptimization(link) {
      const state = L.funnel.getState();
      if (!state.signedIn) {
        L.showAuthModal({
          mode: "register",
          onSuccess: () => {
            L.funnel.markAuditViewed();
            continueToOptimization(link);
          }
        });
        return;
      }

      if (state.freeOptimizationUsed) {
        L.showFunnelModal({
          title: paywall.title || "No optimization credits left",
          body: paywall.body || "Continue with Luckee credits or upgrade before generating another bundle.",
          cost: "0 Optimization Credits available",
          primary: paywall.primary || "View pricing",
          secondary: paywall.secondary || "Cancel",
          onConfirm: () => { window.location.href = "index.html#pricing"; }
        });
        return;
      }

      L.showFunnelModal({
        eyebrow: "First loop · free",
        title: confirm.title || "Generate the optimization bundle?",
        body: confirm.body || "This creates the field-level fixes for this report.",
        cost: confirm.cost || "Free — included in your first complete loop",
        footnote: confirm.footnote || "",
        primary: confirm.primary || "Generate (free)",
        secondary: confirm.cancel || "Not now",
        onConfirm: () => {
          L.funnel.markOptimizationGenerated();
          window.location.href = addParam(link.getAttribute("href") || "workspace.html", "opt", "1");
        }
      });
    }

    document.querySelectorAll('[data-credit-action="optimize"]').forEach(link => {
      if (link.dataset.creditBound === "1") return;
      link.dataset.creditBound = "1";
      link.addEventListener("click", e => {
        e.preventDefault();
        continueToOptimization(link);
      });
    });
  };

  L.bootstrapFunnelPage = function () {
    L.syncFunnelFromUrl();
    L.refreshAccountSlots();
    L.refreshFunnelStrips();
    L.wireOptimizationCreditLinks();
    L.wireAuthActions();
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
        if (group.getAttribute("data-tab-scroll") === "panel") {
          const panel = document.querySelector('[data-panel="' + key.replace(/"/g, '\\"') + '"]');
          if (panel) {
            const stickyOffset = Array.from(document.querySelectorAll(".appbar, .nav, .ws-bar"))
              .reduce((sum, el) => {
                const style = window.getComputedStyle(el);
                if (style.position !== "sticky" && style.position !== "fixed") return sum;
                const rect = el.getBoundingClientRect();
                if (rect.bottom <= 0 || rect.top >= window.innerHeight) return sum;
                return sum + rect.height;
              }, 0);
            const top = Math.max(0, panel.getBoundingClientRect().top + window.scrollY - stickyOffset - 18);
            window.scrollTo({ top, behavior: "smooth" });
            return;
          }
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  };

  window.Luckee = L;
  document.addEventListener("DOMContentLoaded", () => { L.initReveal(); });
})();

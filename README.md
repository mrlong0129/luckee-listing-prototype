# Luckee Listing — interactive prototype

A clickable, high-fidelity prototype of **Luckee Listing** — an Amazon listing‑optimization product positioned as *“listing for AI agents.”* It helps sellers optimize a product listing so AI shopping assistants (Amazon **Rufus** + the **COSMO** ranking) — and human shoppers — can confidently answer pre‑purchase questions, which lifts conversion. In‑platform **SEO → GEO**.

## ▶️ Open it

**Live demo:** https://mrlong0129.github.io/luckee-listing-prototype/

Just click the link — no install needed. Start on the landing page and follow the flow:

**Landing → Audit → Diagnosis report → Optimization workspace → Export**

## What’s inside

| Page | What it shows |
|---|---|
| `index.html` | Landing page — the value story, why‑us, comparison, sample report, proof, pricing |
| `audit.html` | Start an audit (ASIN/URL or paste your listing) + a live “analysis in progress” moment |
| `report.html` | Diagnosis report — answerability score, evidence pack, a 20+ question Rufus Q&A simulation, competitor benchmark, prioritized fixes |
| `workspace.html` | Optimization workspace — Title / Bullets / A+ / Search Terms with word‑level diffs, evidence‑gated suggestions, and a ready‑to‑paste export |

## Notes

- This is a **design prototype** with **fixed sample data** (a Funflow 6‑in‑1 hair dryer brush). There is no live backend, no real Amazon fetch, and no publishing to Seller Central — the last mile is an **Export ready‑to‑paste brief**.
- It is **evidence‑gated**: anything not supported by the page’s own evidence is shown as a `[confirm …]` placeholder rather than invented.
- Proof figures and the “before/after” are clearly labeled **Illustrative** sample content.
- Built as plain static HTML / CSS / JS — no build step.

## Run locally

```bash
# from this folder
python3 -m http.server 8848
# then open http://localhost:8848/index.html
```

---

*Prototype for demonstration only. Sample/illustrative content throughout.*

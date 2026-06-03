# Luckee Listing — interactive prototype

A clickable, high-fidelity prototype of **Luckee Listing** — an Amazon listing‑optimization product for the AI‑shopping era. It finds the buyer questions your listing can't answer for **Alexa for Shopping** *(formerly Rufus)*, the **COSMO** ranking, and human shoppers — then generates fixes you can paste straight into **Title, Bullets, A+ and Search Terms**. In‑platform **SEO → GEO**.

## ▶️ Open it

**Live demo:** https://mrlong0129.github.io/luckee-listing-prototype/

Just click the link — no install. Follow the flow:

**Landing → Audit → Diagnosis report → Optimization workspace → Export**

## What's inside

| Page | What it shows |
|---|---|
| `index.html` | Landing — value story, why‑us, comparison, how‑it‑works, the optimization workspace, proof, “built safe for Amazon”, ongoing‑optimization, pricing |
| `audit.html` | Start an audit (ASIN/URL or paste) with a sample‑result preview, or jump straight to the sample report |
| `report.html` | Diagnosis report — at‑a‑glance score, evidence pack, a 20+ question **Alexa Shopping Q&A simulation**, competitor benchmark, prioritized fixes |
| `workspace.html` | Optimization workspace — Title / Bullets / A+ / Search Terms with word‑level diffs, evidence‑gated suggestions, byte/compliance checks, and a ready‑to‑paste export |

## Notes

- **Design prototype** with **fixed sample data** (a Funflow 6‑in‑1 hair dryer brush). No live backend, no real Amazon fetch, no Seller‑Central publishing — the last mile is an **Export ready‑to‑paste brief**.
- **Evidence‑gated:** anything not supported by the page's own evidence is shown as a `[confirm …]` placeholder rather than invented.
- Proof figures and the before/after are clearly labeled **Illustrative**; scene imagery is AI‑generated and illustrative.
- Plain static HTML / CSS / JS — no build step.

## Run locally

```bash
python3 -m http.server 8848
# open http://localhost:8848/index.html
```

---

*Prototype for demonstration only. Sample/illustrative content throughout. “Alexa for Shopping” is Amazon's AI shopping assistant (formerly Rufus).*

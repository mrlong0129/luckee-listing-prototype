# Luckee Listing · GTM First Context Pack

This folder is the product/growth handoff context for the Luckee Listing GTM First MVP.

Prototype:

- Live prototype: https://mrlong0129.github.io/luckee-listing-prototype/
- Prototype repo: https://github.com/mrlong0129/luckee-listing-prototype

## Read Order

1. [21 · Product/Growth Deliverables](21-gtm-first-product-growth-deliverables-2026-06-11.md)
   - What product/growth must provide to frontend and backend.
   - Includes frontend event dictionary, backend conversion rules, validation, completed loop, credits, subscription, and open decisions.
2. [20 · MVP Engineering Handoff](20-gtm-first-mvp-engineering-handoff-2026-06-11.md)
   - Engineering checklist for the GTM First MVP.
3. [19 · Frontend Events and Backend Tech List](19-gtm-first-frontend-events-backend-tech-list-2026-06-11.md)
   - Full frontend event list and backend technical data requirements.
4. [18 · P0 Frontend/Backend Delivery](18-gtm-first-p0-frontend-backend-delivery-2026-06-11.md)
   - P0 implementation scope.
5. [17 · ROI Scorecard](17-gtm-first-wave-roi-scorecard-2026-06-11.md)
   - Metrics and ROI formulas for the first GTM wave.
6. [16 · Google Ads Funnel Events](16-google-ads-funnel-events-2026-06-11.md)
   - Funnel event design and Google Ads conversion logic.

## Current Product Decisions

- User enters ASIN or Amazon product link first.
- Clicking `Audit my real ASIN` opens login/sign-up if needed; the audit starts after auth.
- Remove `Paste my listing`; do not require users to paste a full listing.
- Real listing report generation currently takes about 10-15 minutes.
- A valid `Accept` should copy the field content to the clipboard and show copy feedback.
- Validation-blocked suggestions must not trigger accept or completed loop.
- Logged-in navigation should not show `Get my free audit`.
- Subscription, user, and credits should reuse Luckee 1.0 and stay inside the Listing tool.

## Main GTM First Measurement Goal

For any Google Ads click, the system should be able to trace:

```text
landing -> ASIN -> auth -> report -> workspace -> completed loop -> subscription -> ROI
```

Primary conversion:

```text
listing_completed_loop
```

Commercial result:

```text
listing_subscription_success
```

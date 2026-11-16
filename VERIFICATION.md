# Verification record

Date: **2026-11-16**. Current app-shell version: **`rupiah-pocket-v3-20261116-r2`**.

## Version 3: English interface and selectable currencies

The interface, currency picker, accessibility labels, page title, and PWA metadata are in English. Users can select **one, two, or three currencies**; USD, TWD, and MYR remain defaults. Preferences and the full available rate dataset are stored on the device.

### Automated checks

- `node test-amount.mjs`: all 15 existing amount-parser and keypad checks passed.
- `node test-rates.mjs`: 28 checks passed for primary/fallback normalization, additional currencies, invalid data, preference limits, previous-cache migration, and refresh deadlines.
- Syntax checks passed for `app.js`, `amount.js`, `rates.js`, and `sw.js`.

### Layout and interaction

Chromium and macOS Safari passed the **390 × 844**, **393 × 852**, and **320 × 568** CSS viewports with **1, 2, and 3 currencies**, both normally and with simulated **59 px top / 34 px bottom safe-area padding**. All combinations fit without vertical scrolling or invading the bottom safe area. Main controls remain at least 44 CSS pixels high (Chromium's zoom measurements can differ by less than 0.02 px).

The following flows passed in both browsers:

- Currency search by English name/code, selected currencies remaining visible during search, and current choices appearing first.
- Saving 1–3 choices, preventing a fourth selection, preventing an empty saved selection, and Cancel leaving preferences unchanged.
- Preferences surviving app reopening.
- Custom-currency conversions, JPY's zero decimal places, and large values staying visible without truncation.
- Optional phone-keyboard mode hiding the app keypad and restoring it on completion.
- A **320 × 280** visible viewport keeping the amount input accessible; the currency dialog fitting that reduced height and hiding the underlying app keypad during search.
- Primary-provider failure selecting the fallback for custom currencies.
- Both providers failing while an existing three-currency saved dataset remains usable after migration, with English saved/stale status.
- Fresh startup/foreground/connectivity checks avoiding duplicate requests and expired data triggering a refresh. Foreground visibility is explicitly simulated in the event test; an OS-background Safari window correctly suppresses a visibility-only refresh until the document is visible.

Fixed fixtures verified **175,500 IDR → EUR 9.87 / JPY 1,645**, and **50,000 IDR → EUR 2.81 / GBP 2.50** for the primary fixture. These fixture values test calculation behavior and are not live exchange-rate quotes.

### Offline use and actual previous-version upgrade

Both Chromium and macOS Safari completed these checks:

1. Save the full rate dataset and a custom EUR/GBP preference.
2. Disable network responses for the isolated app source, destroy its iframe, and reopen it.
3. Confirm saved preferences, EUR/GBP conversion, English offline status, and changing to JPY entirely offline.
4. Reopen again and confirm the offline currency choice persists.

For the update test, the server initially served the **actual previous v2 source**, including its Chinese interface and three-currency cache format. After a controlled v2 page contained `50`, the server switched to v3 and the worker updated. Both browsers automatically loaded the English version, retained `50`, migrated the saved rates, downloaded the expanded dataset, cached the new `rates.js` module, and removed the old v2 cache.

The entire test server was then stopped. In both browsers, the upgraded v3 app still reopened and calculated EUR/GBP offline with the new preferences. This verifies the new module is included in the offline shell; no reinstall was used in this test.

### Cloudflare clean-URL regression

Production Safari exposed a navigation failure because Cloudflare Pages redirects `index.html` to `/`. The worker now precaches and returns the canonical `./` document, and does not precache the redirecting `index.html` URL. Chromium and Safari both passed a regression test with a local server reproducing that 308 redirect: the cached document was not redirected, and the app cold-reopened and converted EUR/GBP after the entire server was stopped.

## Physical iPhone verification — owner-reported, previous v2 release

**Date:** 2026-11-16. **Result:** Passed for offline reopening and currency conversion in the installed Home Screen app at **https://rupiah-pocket.pages.dev/**.

The owner reported enabling Airplane Mode, turning off Wi-Fi, closing the installed app, reopening it from the Home Screen, and confirming that currency conversion still worked normally while offline.

This is a physical-device result reported by the owner, rather than an assistant-observed test or desktop simulation. The iPhone model and iOS version were not recorded. It confirms offline reopening and conversion in **the previous v2 release**; it does not establish a physical-device pass for v3's currency picker, English interface, or upgrade path.

## Production and installation

The production URL is **https://rupiah-pocket.pages.dev/**. The public GitHub repository is connected to Cloudflare Pages; pushes to `main` deploy automatically. The v3 production release was verified at runtime commit `5718e02`: HTML, CSS, all three JavaScript modules, the service worker, manifest, and three icons returned HTTP 200 and matched the reviewed source byte-for-byte. The manifest MIME type and `sw.js` no-cache header were correct. The live primary and fallback endpoints parsed successfully; their datasets supplied 165 and 286 valid three-letter target codes respectively at the time of the check.

The existing macOS Safari session received the corrected shell after reloading, without removing its installed data. The production app also opened in Chromium; EUR/JPY/GBP choices survived a page reload, and a 390 × 844 view fit without scrolling. The live daily dataset displayed 175,500 IDR as EUR 8.73 / JPY 1,539 / GBP 7.29 during the check.

The manifest retains the same app ID, start URL, and scope. Its display name and language are now English. Actual icon dimensions remain **192 × 192**, **512 × 512**, and **180 × 180** for the Apple touch icon. Updating an existing app normally requires an online launch/foreground visit, rather than removing its Home Screen icon.

## Test method and remaining limits

Isolated browser tests use the app source with rate URLs redirected to local fixtures and `navigator.onLine` simulated for offline status. The upgrade test serves the previous and current source trees at the same origin. Offline reopening is checked with network responses unavailable; the post-upgrade check stops the entire local test server. These test injections are not published to production.

**The assistant has not performed physical iPhone testing of v3.** Actual iOS toolbar/gesture-bar behavior, native keyboard presentation, long-term storage retention, rate refresh after reconnecting, and app upgrades on a physical iPhone still need device confirmation. Desktop safe-area and viewport checks remain simulations, separate from the owner's v2 report.

## Operating profile

Static Cloudflare Pages deployment with no backend functions, paid exchange-rate API, or AI model. Core app assets and icons total approximately 40 KB before compression. The complete supported currency dataset is fetched in one request per due refresh, with no request for each key press or currency selection. Failed refreshes retain saved data, and an older fallback dataset does not replace a newer saved dataset. The documentation screenshot is not precached by the app.

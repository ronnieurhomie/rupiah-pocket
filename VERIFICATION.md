# Verification record

Date: **2026-11-16**. App-shell version: **`rupiah-pocket-v2-20261116`**.

## Automated checks

- `node test-amount.mjs`: all 15 amount-parser and keypad checks passed.
- `node --check app.js`, `amount.js`, and `sw.js`: syntax checks passed.

## Browser layouts and interaction

Chromium and local macOS Safari were tested using exact iframe CSS viewports of **390 × 844**, **393 × 852**, and **320 × 568**. Each layout fit without vertical scrolling, showed all three conversion results, and kept the reading area separate from the lower keypad.

Each size was also stress-tested with simulated **59 px top / 34 px bottom safe-area padding**. All keypad buttons remained within the available area. CSS button height is at least 44 px; Chromium's page-zoom measurements showed a floating-point difference of less than 0.01 px.

The tested flows included:

- `175.5` → Rp175,500; duplicate decimal prevention, backspace, and clear.
- `150K` and `十五萬` → Rp150,000, without multiplying an explicit unit twice.
- Native-keyboard mode hides the app keypad; completing entry restores read-only input and the app keypad.
- A simulated **320 × 280** visible viewport still shows the results and amount input.
- macOS Safari dynamic viewport sequence **390 × 844 → 390 × 724 → 390 × 620 → 390 × 844**, without scrolling or losing the bottom keypad margin.

## Rates and recovery

A fixed primary-provider fixture verified the conversion formulas: **175,500 IDR → USD 10.97 / TWD 351.00 / MYR 52.65**.

Tests confirmed that primary-provider failure selects the fallback provider and updates attribution. When both sources fail, the last successful rates remain usable and the saved/stale-data status appears.

In macOS Safari, fresh rates caused **zero** requests when foreground and connectivity-restored events were dispatched. Expired rates caused **one** refresh on foreground return, followed by no duplicate request on a subsequent connectivity event.

## Offline reopening and app updates

Both Chromium and Safari completed these checks:

1. Load successfully and wait for service-worker control.
2. Make every network GET to the isolated test-app source fail.
3. Destroy and recreate the app iframe.
4. Confirm the cached app reopens, calculates with the last saved rates, and displays offline status.

Both browsers also completed a worker-upgrade test: enter `50` in a controlled v1 test shell, serve v2, update the worker, and confirm automatic reload into v2, preservation of `50`, and removal of old app caches.

## Manifest and production checks

- Manifest uses `standalone`, with relative `start_url` and `scope`.
- Actual icon dimensions: **192 × 192**, **512 × 512**, and an **180 × 180** Apple touch icon.
- Production URL **https://rupiah-pocket.pages.dev/** opened successfully and returned HTTP 200.
- Production HTML, CSS, both JavaScript modules, service worker, manifest, and three icons all returned HTTP 200 and matched the reviewed local source byte-for-byte.
- Manifest MIME type was correct; `sw.js` returned `Cache-Control: no-cache`.
- The primary rate endpoint allowed CORS with `*`. The production UI fetched the **2026-11-16** daily dataset: `175.5` displayed Rp175,500, USD 9.63 / TWD 317.06 / MYR 39.37.
- The live site was also opened and used in macOS Safari: `50` displayed Rp50,000 and all three conversions.
- GitHub pushes to `main` triggered successful Cloudflare Pages production deployments. The verified source commit `86890ac93ca59415dc450841b5673503d5b25347` deployed as `cd928092-bbb5-4795-ac9f-0e5c41d4de81`.

The source repository was initially private and was subsequently made public at the owner's request. The source and its three existing commits were reviewed for credential patterns before that change; no API keys, OAuth tokens, or private keys were found. No credentials are needed by the app.

## Physical iPhone verification — owner-reported

**Date:** 2026-11-16. **Result:** Passed for offline reopening and currency conversion in the installed Home Screen app at **https://rupiah-pocket.pages.dev/**.

The owner reported completing the following steps on a physical iPhone:

1. Enable Airplane Mode.
2. Turn off Wi-Fi.
3. Close the installed app and reopen it from the Home Screen.
4. Confirm that currency conversion still works normally while offline.

This is a real-device result reported by the owner, rather than an assistant-observed test or desktop simulation. The iPhone model and iOS version were not recorded. The report confirms that the installed app can reopen and calculate without connectivity; it does not independently verify the exact saved-rate values or offline status text.

## Method and remaining limits

The isolated browser tests used the same app source with only the rate URLs redirected to local fixtures and worker-version markers added for the upgrade scenario. The offline test actually disabled responses from the test source and separately simulated `navigator.onLine=false` to verify its status message. Test injections were not published to production.

The owner-reported iPhone test above supplements the assistant's macOS Safari and Chromium checks. Actual iOS toolbar and gesture-bar behavior, native keyboard presentation, long-term storage retention, rate refresh after reconnection, and app upgrades on a physical iPhone have not been established by that report. Desktop safe-area and viewport simulations remain separate from physical-device verification.

The README retains a repeatable offline checklist, including saved-result comparison and restoration of connectivity, for future device checks.

## Operating profile

Static Cloudflare Pages deployment, no backend functions, paid exchange-rate API, or AI model. Core app resources and icons total approximately **28 KB uncompressed**. The documentation screenshot is not precached by the app. Normal refresh checks avoid repeated requests within an hour and respect the primary provider's next-update time.

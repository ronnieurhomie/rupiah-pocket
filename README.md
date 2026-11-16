# Rupiah Pocket

A small, offline-capable currency converter for travelers in Indonesia. Enter an Indonesian rupiah price and see **USD, TWD, and MYR together**, with an iPhone-friendly keypad and a Home Screen app experience.

**[Open the app](https://rupiah-pocket.pages.dev/)** · [Verification notes](VERIFICATION.md)

The app's display name is **印尼盾快算** and its interface is in Traditional Chinese. This repository's documentation is in English.

## Why it exists

Rupiah prices involve a lot of zeros. Checking a menu, taxi fare, or shop price should take a few thumb taps, without switching between three currency pairs or reopening a chat. Rupiah Pocket treats an ordinary entry as **thousands of IDR**, keeps all three conversions visible, and remains useful when mobile data is unavailable.

It runs independently as a static website and installable Progressive Web App (PWA). It requires no ChatGPT login, Lovable account, API key, backend, paid model, or build step.

## What it does

- Converts IDR into USD, TWD, and MYR simultaneously.
- Opens with its own numeric keypad, including decimal, backspace, and clear controls.
- Supports an optional native phone keyboard through an explicit button tap.
- Uses the latest available **daily reference rates**, with a secondary provider if the primary request fails.
- Saves the last successfully fetched rates locally and caches the app shell for offline reopening.
- Displays the source data's date, saved/offline state, and a warning when data is more than 48 hours old.
- Checks for app updates and activates a complete new shell version while preserving an in-progress amount.

These are reference conversions, not bank quotes or executable exchange prices. Card fees, spreads, and exchange-counter charges are not included.

## Entering a price

| Entry | Interpreted amount | Rule |
| --- | --- | --- |
| `50` | Rp50,000 | Plain numbers mean thousands of IDR |
| `175.5` | Rp175,500 | Decimal thousands are supported |
| `150K` | Rp150,000 | Explicit units are not multiplied again |
| `十五萬` | Rp150,000 | Chinese amount units are also recognized |

The built-in keypad is available immediately. Tap the keyboard icon in the amount panel to use the phone keyboard; tap **Done** (shown as `完成`) to return to the app keypad. Native keyboard opening depends on a user gesture in iOS Safari; the app does not rely on `autofocus`.

## Install on iPhone

1. Open **https://rupiah-pocket.pages.dev/** in Safari.
2. Open **Share → Add to Home Screen**. Depending on the Safari layout, Share may be inside the page menu.
3. If shown, leave **Open as Web App** enabled, then tap **Add**.
4. Launch the new icon **while online** and wait for the daily-rate date to appear before relying on offline use.

An older icon for another host still opens that older website. Use an icon created from the production URL above.

## Verify offline use on your own phone

1. Open the Home Screen app while online, enter `50`, and note the three results and rate date.
2. Enable Airplane Mode and explicitly turn off Wi-Fi in **Settings → Wi-Fi**. Airplane Mode can retain a previously enabled Wi-Fi connection.
3. Close the app from the app switcher, then reopen it using the Home Screen icon.
4. Enter `50` again. The results should match the saved-rate calculation. Enter `100`; results should be approximately twice as large, allowing for rounding.
5. Confirm the status indicates **offline / saved data**, with the same source date.
6. Restore connectivity and reopen the app or bring it to the foreground. It checks whether a rate refresh is due and saves a successful update for the next offline session.

An unchanged rate date after reconnecting is expected when the provider has not published its next daily dataset. Offline data is the last successfully stored dataset, not a live quote. If website/app storage has been cleared or evicted, open the app online again to restore its cache.

## How rates work

The primary endpoint is [ExchangeRate-API Open Access](https://open.er-api.com/v6/latest/USD). Its USD-based response is converted into per-IDR rates:

```text
USD per IDR = 1 / rates.IDR
TWD per IDR = rates.TWD / rates.IDR
MYR per IDR = rates.MYR / rates.IDR
converted amount = IDR amount × per-IDR rate
```

If the primary request fails or returns invalid data, the app tries [fawazahmed0 currency-api](https://github.com/fawazahmed0/exchange-api) at:

```text
https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json
```

The fallback already supplies rates per IDR. The displayed attribution follows the selected provider; the primary provider's required [Rates By Exchange Rate API](https://www.exchangerate-api.com) link is retained.

Successful rates are saved in `localStorage`. Refresh checks run on startup, return to the foreground, and restored connectivity. Requests are normally limited to once per hour and respect the primary provider's announced next-update time. The date shown in the app comes from the provider's dataset, displayed in the device's local time, rather than from the time the page was opened.

If both providers fail, the last successful rates remain available. Before any successful rate download, an included reference snapshot provides an initial estimate and is identified as saved data, with a stale warning when applicable. Each provider request has an eight-second timeout.

## Layout and offline architecture

The reading area and keypad are positioned separately: the three results sit above the amount input, while the keypad occupies the lower part of the screen. The design uses a warm off-white background, dark green text, and light green controls. Buttons are at least 44 CSS pixels high.

CSS uses safe-area insets and `svh`/`dvh`; native-keyboard mode also uses `visualViewport.height` so the app keypad can be hidden and the available reading area can adapt.

`sw.js` precaches the HTML, styles, JavaScript modules, manifest, and icons. Both navigation and modules are served from the same installed shell version. Rate API responses are not stored in that service-worker cache; validated rates are stored separately in `localStorage`.

When cached app assets change, increment `VERSION` in `sw.js`. A successfully installed new worker activates immediately, removes previous app caches, and reloads an already controlled page once. The amount is temporarily retained in `sessionStorage` across that upgrade reload. The service-worker response uses `Cache-Control: no-cache` to support update checks.

## Project structure

```text
index.html               App interface and PWA metadata
styles.css               Responsive layout, safe areas, and keypad styling
app.js                   Conversion UI, rate fetching/storage, and updates
amount.js                Amount parsing and keypad behavior
sw.js                    Versioned offline app-shell cache
manifest.webmanifest     Installable PWA configuration
icons/                   Home Screen and PWA icons
docs/iphone-layout.jpg   Captured production layout; not a physical-device photo
_headers                 Cloudflare Pages response headers
test-amount.mjs           Amount and keypad checks
VERIFICATION.md          Completed checks and remaining device-test limits
```

## Run locally

The production app has no external JavaScript dependencies. Node is needed only for the included tests, and Python is one convenient way to serve the files locally.

```sh
git clone https://github.com/ronnieurhomie/rupiah-pocket.git
cd rupiah-pocket
node test-amount.mjs
node --check app.js
node --check amount.js
node --check sw.js
python3 -m http.server 4173
```

Open **http://localhost:4173/**. Use HTTP on localhost or HTTPS for service-worker testing; opening `index.html` through `file://` is not an offline-installation test.

## Deployment

The public GitHub repository is the source of truth. **Cloudflare Pages** serves the production website and automatically deploys pushes to `main`. GitHub Pages is not used.

| Setting | Value |
| --- | --- |
| Production URL | https://rupiah-pocket.pages.dev/ |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `.` |
| Root directory | Default repository root |

The GitHub and Cloudflare Pages setup uses free services and the provided `pages.dev` subdomain. There is no custom domain, server function, paid API, or recurring service purchased for this project. The core app assets and icons total approximately 28 KB before compression; the documentation screenshot is not part of the offline app shell.

Official deployment references: [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/) and [static HTML deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).

## Privacy and verification

Entered prices and saved rates stay in the browser. The app has no account system, analytics, telemetry, voice recognition, or AI integration. Online rate requests go directly from the browser to the exchange-rate providers, and static files are served by Cloudflare Pages.

Amount/keypad checks, the requested phone-size layouts, desktop Safari/Chromium interactions, offline reopening, and service-worker upgrades have been verified.

**Physical iPhone offline test passed — owner-reported on 2026-11-16.** The owner enabled Airplane Mode, turned off Wi-Fi, closed the installed Home Screen app, and reopened it. Currency conversion continued to work offline. This result confirms offline reopening and conversion on the owner's iPhone; other device-specific checks remain separate. See [VERIFICATION.md](VERIFICATION.md) for the test scope and remaining limits.

<details>
<summary>Production layout capture</summary>

![Rupiah Pocket at a 390 × 844 CSS-pixel viewport](docs/iphone-layout.jpg)

</details>

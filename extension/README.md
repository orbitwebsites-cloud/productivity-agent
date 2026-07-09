# ScreenBuddy Jarvis Autofill (browser extension)

Fills web forms from a profile you save in the ScreenBuddy desktop app — for you to
**review before submitting**. It never clicks Submit/Next or calls `form.submit()` itself;
see `content.js`'s header comment, that boundary is deliberate.

Talks to the desktop app over a **loopback-only** bridge at `http://127.0.0.1:8643` (see
`electron/autofill-bridge.js`) — nothing outside this machine can reach it.

## Load it — Chrome / Edge / Brave / any other Chromium browser (Kimi's browser included,
most Chromium-based browsers use the same `chrome://extensions` loader)
1. Go to `chrome://extensions` (or the equivalent in your browser).
2. Turn on **Developer mode**.
3. **Load unpacked** → select this `extension/` folder as-is (it already uses
   `manifest.json`, the Chrome/MV3 variant).

## Load it — Firefox
Firefox's MV3 background pages don't support the `service_worker` manifest key that Chrome
uses — everything else (`chrome.*`/`browser.*` APIs, content scripts, popup) is the same
code, no separate build. Two ways to run it:

- **Quick/temporary (until you restart Firefox):** go to `about:debugging#/runtime/this-firefox`
  → **Load Temporary Add-on** → pick `manifest.firefox.json` directly from this folder.
- **Persistent local install:** copy this folder, then in the copy replace `manifest.json`
  with the contents of `manifest.firefox.json` (same filename, Firefox-flavored content),
  then load that copy the same way.

## Using it
1. In the ScreenBuddy desktop app: **Settings → Jarvis Mode → Browser Autofill** — turn it on
   and fill in your profile (name, email, discord, IGN, etc.).
2. Either click the extension icon → **Fill this page** (always works, no bridge round trip
   needed beyond the one `GET /profile` call), or text `!autofill` to Jarvis on WhatsApp to
   fill whatever tab is currently active (best-effort — see the note in `background.js` about
   MV3 background-page suspension).
3. Review the highlighted fields and the banner at the top of the page, then submit it
   yourself. Nothing here submits anything for you.

## Files
- `manifest.json` — Chrome/Edge/Chromium (MV3, `service_worker` background)
- `manifest.firefox.json` — Firefox (MV3, `scripts` background + `browser_specific_settings`)
- `background.js` — best-effort WS listener, asks the active tab's content script to fill
- `content.js` — the actual field-matching + fill + review-banner logic (shared, unmodified
  between browsers)
- `popup.js` / `popup.html` — manual "Fill this page" button, the reliable path

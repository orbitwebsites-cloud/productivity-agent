# ScreenBuddy Jarvis Autofill + Browser Agent (browser extension)

Two things, same extension:
1. **Autofill** — fills web forms from a profile you save in the ScreenBuddy desktop app,
   for you to **review before submitting**.
2. **Browser agent** (`!browser <instruction>` on WhatsApp, e.g. `!browser open the FAQ page
   and tell me the refund policy`) — a short click/type/navigate loop (`electron/browser-agent.js`)
   that reads the page, decides the next step, and does it.

Both share one hard boundary: **it never clicks Submit/Buy/Pay/Subscribe/Delete/Confirm-order,
and never calls `form.submit()`.** Enforced in `content.js` (`agentAct`'s denylist, and
`fillForm` simply never touches submit buttons) — regardless of what the AI decides to do,
those actions are blocked and reported back, not attempted. See `content.js`'s header comments.

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
   (this starts the bridge both features need) and fill in your profile (name, email, discord,
   IGN, etc.) for autofill.
2. **Autofill:** click the extension icon → **Fill this page** (always works, no bridge round
   trip needed beyond the one `GET /profile` call), or text `!autofill` to Jarvis on WhatsApp to
   fill whatever tab is currently active.
3. **Browser agent:** text `!browser <what you want done>` to Jarvis on WhatsApp. It reads the
   active tab, takes up to 6 steps, and reports back what it found/did — or that a step needed
   your own click because it was a submit/pay/delete/subscribe-type action.
4. Both are best-effort when triggered remotely via WhatsApp — see the note in `background.js`
   about MV3 background-page suspension. The extension popup's "Fill this page" is the one
   path that doesn't depend on that.
5. Review before you act — highlighted fields + banner for autofill, the step-by-step summary
   for the browser agent. Nothing here submits, buys, or deletes anything for you.

## Files
- `manifest.json` — Chrome/Edge/Chromium (MV3, `service_worker` background)
- `manifest.firefox.json` — Firefox (MV3, `scripts` background + `browser_specific_settings`)
- `background.js` — best-effort WS listener; relays fill/snapshot/act requests to the active
  tab's content script and replies with the result
- `content.js` — field-matching + fill (`fillForm`) and the browser-agent's element snapshot +
  action executor with the denylist (`agentSnapshot`/`agentAct`) — shared, unmodified between
  browsers
- `popup.js` / `popup.html` — manual "Fill this page" button, the reliable autofill path

## Verified this session (sandbox, not a real browser)
Loaded the unpacked extension in headless Chromium via Playwright against a local test page:
autofill filled 6/6 recognized fields and never touched the submit button; the browser-agent
loop correctly navigated a 2-step task ("find the refund policy" → click FAQ → report the
answer) end-to-end through a real AI decision loop (stubbed model for the test, real prompt/
parsing code); and separately confirmed both the low-level denylist and the full agent loop
refuse to click "Buy Now" / "Submit Application" style elements. **Not yet verified in a real
desktop browser, in Firefox, or with a real Hermes/local model driving the decisions** — do
that before relying on it for anything that matters.

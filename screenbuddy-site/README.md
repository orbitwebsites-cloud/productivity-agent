# ScreenBuddy Site

Static landing and support site for ScreenBuddy.

- Home domain: `screenbudy.orbitboyzz.me`
- Support domain: `support.orbitboyzz.me`

The support page reads setup failure data from URL query params:

```text
https://support.orbitboyzz.me/?error=...&platform=win32&version=0.1.0
```

It prefills the support form so the user only enters an email.

## Deploy

Use Cloudflare Pages, Vercel, or Netlify with this repo as a static site.
Attach both custom domains to the same deployment:

- `screenbudy.orbitboyzz.me` -> home page
- `support.orbitboyzz.me` -> support page redirect

The form posts to `https://formsubmit.co/support@orbitboyzz.me`.
That inbox must confirm FormSubmit once before messages are delivered.

## Download Link

`site.js` fetches `latest.yml` from the R2 releases bucket at page load and reads
its `version:` field -- the same manifest `scripts/publish-release.js` uploads on
every tagged release build (see `.github/workflows/build-beta.yml`) -- and builds
the Windows/Mac download URLs from that version. **The site never needs a manual
version bump**; it always links to whatever was actually published last.

`FALLBACK_VERSION` in `site.js` is only used if that fetch fails (network hiccup,
feed down, or R2 CORS not yet configured -- see below); update it occasionally as
a safety net, not as the primary way version info reaches the site.

### One-time setup: R2 CORS

The fetch is cross-origin (site domain -> `downloads.screenbudy.orbitboyzz.me`),
so the R2 bucket needs a CORS policy allowing GET from the site's origin, e.g. in
the Cloudflare dashboard (R2 -> bucket -> Settings -> CORS Policy):

```json
[
  {
    "AllowedOrigins": ["https://screenbudy.orbitboyzz.me"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

Without this, `fetch()` fails (silently, in the console) and the site falls back
to `FALLBACK_VERSION` -- broken downloads never ship, but the auto-sync won't
kick in until CORS is set.

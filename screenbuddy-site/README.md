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

The home page currently points to a static download path:

```text
/downloads/ScreenBuddy-0.1.0-beta-win-x64.exe
```

Before deploying, copy the generated portable build into `screenbuddy-site/downloads/`.
That folder is ignored by git so the source repo stays light:

```powershell
New-Item -ItemType Directory -Force -Path screenbuddy-site\downloads
Copy-Item "dist\ScreenBuddy 0.1.0.exe" "screenbuddy-site\downloads\ScreenBuddy-0.1.0-beta-win-x64.exe"
```

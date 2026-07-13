'use strict';

const RELEASES = 'https://downloads.screenbudy.orbitboyzz.me/releases/';

// Last-known-good version, used only if the live manifest fetch below fails
// (network hiccup, R2 CORS not configured yet, feed down). Update this only
// as a fallback of last resort -- the real source of truth is latest.yml,
// which electron-builder + scripts/publish-release.js regenerate and upload
// on every tagged release, so the site never depends on someone remembering
// to hand-edit a version number here again.
const FALLBACK_VERSION = '0.1.7';

function urlsFor(version) {
  return {
    win32: `${RELEASES}ScreenBuddy-Setup-${version}.exe`,
    macArm64: `${RELEASES}ScreenBuddy-${version}-arm64.dmg`,
    macX64: `${RELEASES}ScreenBuddy-${version}-x64.dmg`
  };
}

async function latestVersion() {
  // latest.yml is the Windows auto-update manifest electron-builder writes
  // and publish-release.js uploads alongside every release; its `version:`
  // field is the actual latest published version, no matter what shipped.
  const res = await fetch(`${RELEASES}latest.yml`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`latest.yml: HTTP ${res.status}`);
  const text = await res.text();
  const match = text.match(/^version:\s*([\w.-]+)/m);
  if (!match) throw new Error('latest.yml: no version field found');
  return match[1];
}

function renderDownloadLinks(downloads) {
  // Most Macs sold since late 2020 are Apple Silicon (arm64) — default to that build
  // and offer the Intel (x64) one as a small secondary link, since there's no
  // reliable cross-browser way to detect the actual chip from JS.
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const link = document.getElementById('downloadLink');
  const alt = document.getElementById('altDownload');
  if (/mac/i.test(platform)) {
    link.textContent = 'Download for Mac';
    link.href = downloads.macArm64;
    alt.innerHTML = `Apple Silicon (M1/M2/M3/M4) build above. Intel Mac? <a href="${downloads.macX64}" rel="noopener">Download the Intel build</a> instead.`;
  } else {
    link.textContent = 'Download for Windows';
    link.href = downloads.win32;
    alt.innerHTML = `Also on Mac — <a href="${downloads.macArm64}" rel="noopener">Apple Silicon</a> or <a href="${downloads.macX64}" rel="noopener">Intel</a>.`;
  }
}

renderDownloadLinks(urlsFor(FALLBACK_VERSION));
latestVersion()
  .then((version) => renderDownloadLinks(urlsFor(version)))
  .catch((err) => console.warn('[site] Could not fetch latest release version, using fallback:', err));

if (location.hostname.startsWith('support.')) {
  location.replace('/support.html' + location.search);
}

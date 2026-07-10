'use strict';

const RELEASES = 'https://bglwicwloz5njbgs.public.blob.vercel-storage.com/releases/';
const downloads = {
  win32: `${RELEASES}ScreenBuddy-Setup-0.1.2.exe`,
  macArm64: `${RELEASES}ScreenBuddy-0.1.2-arm64.dmg`,
  macX64: `${RELEASES}ScreenBuddy-0.1.2-x64.dmg`
};

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

if (location.hostname.startsWith('support.')) {
  location.replace('/support.html' + location.search);
}

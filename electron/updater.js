'use strict';

// Silent-ish background auto-update via electron-updater. Only meaningful for the
// installed NSIS build (a portable exe has no persistent install location to update
// in place) — checkForUpdates() no-ops harmlessly if something's off, it never
// crashes the app either way.

const { app, Notification } = require('electron');

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null; // dependency missing/broken — auto-update just won't run
}

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // every 4 hours

function init() {
  if (!autoUpdater || !app.isPackaged) return; // never phone home from a dev run

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    console.error('[updater] error', err && err.message ? err.message : err);
  });

  autoUpdater.on('update-downloaded', (info) => {
    try {
      new Notification({
        title: 'ScreenBuddy update ready',
        body: `Version ${info.version} downloaded — it'll finish installing next time you quit Pesto.`,
        silent: true
      }).show();
    } catch { /* notifications aren't critical */ }
  });

  const check = () => { autoUpdater.checkForUpdates().catch(() => { /* offline or feed unreachable — fine */ }); };

  // First check shortly after launch (give the app a moment to settle), then periodically.
  setTimeout(check, 15000);
  setInterval(check, CHECK_INTERVAL_MS);
}

module.exports = { init };

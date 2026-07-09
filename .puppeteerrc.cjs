const { join } = require('path');

// whatsapp-web.js drives Puppeteer's Chromium under the hood (electron/jarvis-whatsapp.js).
// By default Puppeteer downloads Chromium to a per-user home-dir cache
// (~/.cache/puppeteer), which lives OUTSIDE this project and can't be picked up by
// electron-builder's `files` globs (see package.json's `build.files`). Pointing the
// cache inside node_modules makes the download part of the normal npm-install
// output, so a plain `node_modules/**/*` files pattern bundles it into the
// installer — no separate packaging step, no user-facing download at first run.
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer')
};

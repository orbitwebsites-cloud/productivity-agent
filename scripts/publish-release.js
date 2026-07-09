'use strict';

// Uploads a completed electron-builder build (installer(s) + the auto-update
// manifest electron-builder generates alongside them) to Vercel Blob storage,
// at the exact fixed paths electron-updater's "generic" provider expects --
// see package.json's build.publish.url and electron/updater.js.
//
// Run after `npm run build:win` / `npm run build:mac` (electron-builder writes
// dist/latest.yml or dist/latest-mac.yml regardless of --publish=never; that
// flag only controls whether electron-builder itself attempts an upload, which
// it can't do for a "generic" target anyway -- this script is that upload step).
//
// Needs BLOB_READ_WRITE_TOKEN in the environment (a Vercel Blob read-write
// token). In CI this comes from a GitHub Actions secret. Never commit this
// token or hardcode it here.

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const DIST = path.join(__dirname, '..', 'dist');
const PREFIX = 'releases/';

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set.');
  if (!fs.existsSync(DIST)) throw new Error(`${DIST} does not exist -- run the build first.`);

  const files = fs.readdirSync(DIST).filter((f) =>
    /\.(exe|dmg|zip)$/i.test(f) || /^latest.*\.yml$/i.test(f)
  );
  const manifest = files.filter((f) => /^latest.*\.yml$/i.test(f));
  if (!manifest.length) {
    throw new Error(
      `No latest*.yml update manifest found in ${DIST} (only found: ${files.join(', ') || 'nothing'}). ` +
      'electron-builder should generate this automatically for an update-capable target ' +
      '(nsis on Windows, dmg+zip on Mac) -- without it, auto-update silently does not work ' +
      'even if the installer itself uploads fine.'
    );
  }

  for (const file of files) {
    const filePath = path.join(DIST, file);
    process.stdout.write(`Uploading ${file}... `);
    const blob = await put(`${PREFIX}${file}`, fs.createReadStream(filePath), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
      contentType: file.toLowerCase().endsWith('.yml') ? 'text/yaml' : 'application/octet-stream'
    });
    console.log(blob.url);
  }
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });

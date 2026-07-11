'use strict';

// Uploads a completed electron-builder build (installer(s) + the auto-update
// manifest electron-builder generates alongside them) to Cloudflare R2, at the
// fixed public paths electron-updater's "generic" provider expects.

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const DIST = path.join(__dirname, '..', 'dist');
const PREFIX = 'releases/';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

function contentTypeFor(file) {
  const lower = file.toLowerCase();
  if (lower.endsWith('.yml')) return 'text/yaml';
  if (lower.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  if (lower.endsWith('.dmg')) return 'application/x-apple-diskimage';
  if (lower.endsWith('.zip')) return 'application/zip';
  return 'application/octet-stream';
}

async function main() {
  const accountId = requiredEnv('R2_ACCOUNT_ID');
  const accessKeyId = requiredEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requiredEnv('R2_SECRET_ACCESS_KEY');
  const bucket = requiredEnv('R2_BUCKET');
  const publicBaseUrl = requiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');

  if (!fs.existsSync(DIST)) throw new Error(`${DIST} does not exist -- run the build first.`);

  const files = fs.readdirSync(DIST).filter((file) =>
    /\.(exe|dmg|zip)$/i.test(file) || /^latest.*\.yml$/i.test(file)
  );
  const manifests = files.filter((file) => /^latest.*\.yml$/i.test(file));
  if (!manifests.length) {
    throw new Error(
      `No latest*.yml update manifest found in ${DIST} (only found: ${files.join(', ') || 'nothing'}). ` +
      'electron-builder should generate this automatically for an update-capable target ' +
      '(nsis on Windows, dmg+zip on Mac).'
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  for (const file of files) {
    const filePath = path.join(DIST, file);
    const key = `${PREFIX}${file}`;
    process.stdout.write(`Uploading ${file}... `);
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentTypeFor(file)
    }));
    console.log(`${publicBaseUrl}/${key}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

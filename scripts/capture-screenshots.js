#!/usr/bin/env node
'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const RENDERER = path.join(__dirname, '..', 'renderer');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'screenshots');

const PAGES = [
  { name: 'app-pursuits', file: 'app.html', width: 1280, height: 800 },
  { name: 'panel',        file: 'panel.html', width: 380, height: 520 },
  { name: 'buddy',        file: 'buddy.html', width: 320, height: 480 },
  { name: 'orb',          file: 'orb.html', width: 110, height: 110 },
  { name: 'warden',       file: 'warden.html', width: 520, height: 400 },
];

async function capture() {
  const label = process.argv[2] || 'after';
  const outDir = path.join(OUTPUT_DIR, label);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const page of PAGES) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: page.width, height: page.height, deviceScaleFactor: 2 });

    // Mock Electron IPC so pages don't throw
    await tab.evaluateOnNewDocument(() => {
      window.buddy = new Proxy({}, {
        get: () => async () => ({})
      });
    });

    const filePath = path.join(RENDERER, page.file);
    await tab.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

    // Wait for CSS to settle
    await new Promise(r => setTimeout(r, 500));

    const screenshotPath = path.join(outDir, `${page.name}.png`);
    await tab.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  captured: ${page.name}.png`);
    await tab.close();
  }

  await browser.close();
  console.log(`\nAll screenshots saved to ${outDir}`);
}

capture().catch(err => { console.error(err); process.exit(1); });

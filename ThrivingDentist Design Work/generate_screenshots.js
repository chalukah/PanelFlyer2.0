'use strict';
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

function findHTMLFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHTMLFiles(full, results);
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

async function main() {
  const previewDir = path.join(__dirname, 'preview');
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const files = findHTMLFiles(previewDir);
  console.log(`\nScreenshotting ${files.length} HTML files...\n`);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const file of files) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.goto(`file://${file}`, { waitUntil: 'networkidle0', timeout: 20000 });

    const rel = path.relative(previewDir, file);
    const outputName = rel.replace(/[/\\]/g, '__').replace('.html', '.png');
    await page.screenshot({
      path: path.join(screenshotsDir, outputName),
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });
    console.log(`  ✓ ${outputName}`);
    await page.close();
  }

  await browser.close();
  console.log(`\nDone — ${files.length} screenshots saved to ./screenshots/`);
}

main().catch(err => { console.error(err); process.exit(1); });

const playwright = require('playwright');

const BASE_URL = process.env.E2E_URL || 'http://localhost:4173';
const BROWSER = process.env.BROWSER || 'chromium';

// MIME types that static assets must be served with. A wrong MIME (e.g.
// text/html) is exactly what caused the white-screen "module script MIME type"
// errors, so this test fails the CI if any asset regresses.
const EXPECTED = {
  '.js': ['application/javascript', 'text/javascript'],
  '.mjs': ['application/javascript', 'text/javascript'],
  '.css': ['text/css'],
  '.json': ['application/json', 'application/manifest+json'],
  '.svg': ['image/svg+xml'],
  '.webmanifest': ['application/manifest+json', 'application/json'],
};

(async () => {
  console.log('Launching browser:', BROWSER);
  const launchArgs = BROWSER === 'webkit' ? [] : ['--no-sandbox'];
  const browser = await playwright[BROWSER].launch({ args: launchArgs });
  const page = await browser.newPage();

  const failures = [];

  page.on('response', (response) => {
    const url = response.url();
    if (!url.startsWith(BASE_URL) && !url.includes('localhost')) return;
    const path = new URL(url).pathname;
    const ext = path.slice(path.lastIndexOf('.'));
    const allowed = EXPECTED[ext];
    if (!allowed) return;

    const contentType = (response.headers()['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!allowed.includes(contentType)) {
      failures.push(`${path} -> ${contentType || '(none)'} (expected: ${allowed.join(' | ')})`);
    }
  });

  try {
    console.log('Navigating to', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    if (failures.length) {
      console.error('Asset MIME check FAILED:');
      failures.forEach((f) => console.error('  - ' + f));
      await browser.close();
      process.exit(2);
    }

    console.log('Asset MIME check passed: all static assets served with correct content-type.');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Asset MIME check error:', err);
    await browser.close();
    process.exit(2);
  }
})();

const playwright = require('playwright');

const URL = process.env.E2E_URL || 'http://localhost:4173';
const BROWSER = (process.env.BROWSER || 'chromium');

(async () => {
  console.log('Launching browser:', BROWSER);
  const launchArgs = BROWSER === 'webkit' ? [] : ['--no-sandbox'];
  const browser = await playwright[BROWSER].launch({ args: launchArgs });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    console.log('Navigating to', URL);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Unified onboarding: click the "Criar Conta" tab to reveal the signup form
    // (family/parent inputs only render in cadastro + responsável mode).
    const createTab = await page.$('button:has-text("Criar Conta")');
    if (!createTab) {
      throw new Error('Onboarding "Criar Conta" tab not found — demo UI may have leaked.');
    }
    await createTab.click();
    await page.waitForTimeout(300);
    console.log('onboarding present');

    const familyInput = await page.$('input[placeholder*="Família" i]');
    const parentInput = await page.$('input[placeholder*="responsável" i]');
    if (!familyInput || !parentInput) {
      throw new Error('Family/parent name inputs missing from official onboarding.');
    }
    console.log('official signup form fields present');

    // Fill the demo-free signup form (does not require a live backend to render).
    await page.fill('input[type="email"]', 'familia-e2e@example.com');
    await page.fill('input[type="password"]', 'SenhaForte123');
    await familyInput.fill('Família E2E');
    await parentInput.fill('Pai E2E');

    if (consoleErrors.length) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error('Console errors present on load: ' + consoleErrors.join(' | '));
    }

    await page.screenshot({ path: 'e2e_ci_result.png' });
    await browser.close();
    console.log('E2E finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('E2E error', err);
    await page.screenshot({ path: 'e2e_ci_error.png' }).catch(() => {});
    await browser.close();
    process.exit(2);
  }
})();

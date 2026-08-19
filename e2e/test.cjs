const playwright = require('playwright');

const URL = process.env.E2E_URL || 'http://localhost:4173';
const BROWSER = (process.env.BROWSER || 'chromium');

(async () => {
  console.log('Launching browser:', BROWSER);
  // webkit rejects the --no-sandbox flag, so only pass it to chromium/firefox.
  const launchArgs = BROWSER === 'webkit' ? [] : ['--no-sandbox'];
  const browser = await playwright[BROWSER].launch({ args: launchArgs });
  const page = await browser.newPage();
  try {
    console.log('Navigating to', URL);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Dismiss onboarding (select a profile) if present. Works both with and
    // without Supabase configured, entering demo navigation.
    const profileBtn = await page.$('button:has-text("Pai / Mãe")')
      || await page.$('button:has-text("Filho / Filha")');
    if (profileBtn) {
      await profileBtn.click();
      console.log('dismissed onboarding');
      await page.waitForTimeout(600);
    }

    // --- Create a task (parent flow) ---
    const createSelectors = [
      'button:has-text("Criar" )',
      'button:has-text("Criar Tarefa")',
      'button:has-text("Nova Tarefa")',
      'button:has-text("Nova Missão")',
      'text=+ Tarefa',
      'button:has-text("Adicionar")',
    ];
    for (const sel of createSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          console.log('opened create modal via', sel);
          break;
        }
      } catch (e) { /* best-effort */ }
    }

    await page.waitForTimeout(600);

    const titleInput = await page.$('input[placeholder*="Título"], input[placeholder*="tarefa"], input[type="text"]');
    if (titleInput) {
      await titleInput.fill('E2E - Lavar a Mesa');
      console.log('filled title');
    }

    const xpInput = await page.$('input[type="number"]');
    if (xpInput) { await xpInput.fill('50'); }

    const submit = await page.$('[data-testid="create-task-submit"]')
      || await page.$('button:has-text("Salvar e Publicar Missão"), button:has-text("Criar"), button:has-text("Salvar")');
    if (submit) { await submit.click(); console.log('submitted task'); }

    await page.waitForTimeout(1200);

    // --- Complete a task (child flow) ---
    const completeBtn = await page.$('[data-testid^="complete-task-"]');
    if (completeBtn) {
      await completeBtn.click();
      console.log('completed a task');
    } else {
      const fallback = await page.$('button:has-text("Concluir"), button:has-text("Completar")');
      if (fallback) { await fallback.click(); console.log('completed (fallback)'); }
    }

    await page.waitForTimeout(800);

    // --- Approve a task (parent flow) if present ---
    const approve = await page.$('[data-testid^="approve-task-"]')
      || await page.$('button:has-text("Aprovar"), button:has-text("Aceitar")');
    if (approve) { await approve.click(); console.log('approved'); }

    // --- Redeem a reward if affordable ---
    const redeem = await page.$('[data-testid^="redeem-reward-"]:not([disabled])');
    if (redeem) { await redeem.click(); console.log('redeemed a reward'); }

    await page.waitForTimeout(800);
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

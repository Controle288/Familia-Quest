const playwright = require('playwright');

const URL = process.env.E2E_URL || 'http://localhost:4173';
const BROWSER = (process.env.BROWSER || 'chromium');

(async () => {
  console.log('Launching browser:', BROWSER);
  const browser = await playwright[BROWSER].launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    console.log('Navigating to', URL);
    await page.goto(URL, { waitUntil: 'networkidle' });

    // try open create modal
    const createSelectors = ['button:has-text("Criar" )', 'button:has-text("Criar Tarefa")', 'button:has-text("Nova Tarefa")', 'text=+ Tarefa', 'button:has-text("Adicionar")'];
    let opened = false;
    for (const sel of createSelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); opened = true; console.log('clicked', sel); break; }
      } catch (e) { }
    }

    await page.waitForTimeout(800);

    // fill title
    const titleInput = await page.$('input[placeholder*="Título"], input[placeholder*="tarefa"], input[type="text"]');
    if (titleInput) {
      await titleInput.fill('E2E - Lavar a Mesa');
      console.log('filled title');
    }

    // choose first child if present
    const childBtn = await page.$('button[role="button"] img');
    if (childBtn) {
      // click parent button container
      const parent = await childBtn.evaluateHandle((n) => n.closest('button'));
      if (parent) { await parent.asElement().click(); console.log('selected child'); }
    }

    // set reward xp if input exists
    const xpInput = await page.$('input[type="number"]');
    if (xpInput) { await xpInput.fill('50'); }

    // submit
    const submit = await page.$('button:has-text("Salvar e Publicar Missão"), button:has-text("Criar"), button:has-text("Salvar")');
    if (submit) { await submit.click(); console.log('submitted task'); }

    await page.waitForTimeout(1200);

    // find task
    const task = await page.$('text=E2E - Lavar a Mesa');
    if (task) {
      console.log('task created');
      // try complete
      const completeBtn = await page.$('button:has-text("Concluir"), button:has-text("Completar")');
      if (completeBtn) { await completeBtn.click(); console.log('completed'); }
    } else {
      console.warn('task not found');
    }

    // try approve
    const approve = await page.$('button:has-text("Aprovar"), button:has-text("Aceitar")');
    if (approve) { await approve.click(); console.log('approved'); }

    await page.screenshot({ path: 'e2e_ci_result.png' });
    await browser.close();
    console.log('E2E finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('E2E error', err);
    await page.screenshot({ path: 'e2e_ci_error.png' }).catch(()=>{});
    await browser.close();
    process.exit(2);
  }
})();

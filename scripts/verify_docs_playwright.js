async (page) => {
  const days = [32, 56, 109, 126, 141, 146, 155, 156, 164, 198, 217, 247, 266];
  const out = [];
  for (const d of days) {
    await page.fill('input[type=number]', String(d));
    await page.press('input[type=number]', 'Enter');
    await page.waitForTimeout(450);
    out.push(await page.evaluate(day => ({
      day,
      h1: document.querySelector('h1')?.textContent?.trim(),
      pres: document.querySelectorAll('pre').length,
      cjk: (document.body.innerText.match(/[\u4e00-\u9fff]/g) || []).length,
      noFenceText: !document.body.innerText.includes('```'),
    }), d));
  }
  return out;
}

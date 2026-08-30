export default async function run(page, ui) {
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'testfix10a@example.com');
  await page.fill('#password', 'password123');
  await page.click('.auth-card button.btn-primary');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2500);
  return await page.evaluate(() => {
    const btn = document.querySelector('.dashboard-actions-row .btn-primary');
    if (!btn) return 'button not in DOM';
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return {
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      topElement: top ? top.tagName + '.' + (top.className?.toString?.().slice(0, 60) || '') : 'none',
      isBtnItself: btn === top || btn.contains(top) || (top && btn.contains(top)) || top === btn,
    };
  });
}

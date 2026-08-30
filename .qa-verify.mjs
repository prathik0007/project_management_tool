export default async function run(page, ui) {
  const report = [];
  const routes = ['/login', '/register', '/dashboard', '/projects', '/tasks', '/deadlines'];

  // Load protected routes unauthenticated first (expect redirect to /login)
  for (const r of routes) {
    await page.goto('http://localhost:5173' + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    report.push({ route: r, finalUrl: page.url(), title: await page.title(), bodyChars: (await page.content()).length });
  }
  return report;
}

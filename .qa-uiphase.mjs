export default async function run(page, ui) {
  const out = { consoleErrors: [] };
  page.on('pageerror', (e) => out.consoleErrors.push('pageerror: ' + e.message));

  // 1. Register a brand-new user through the redesigned UI
  const email = `uiphase${Date.now()}@example.com`;
  await page.goto('http://localhost:5173/register');
  await page.waitForSelector('form');
  out.registerForm = {
    hasLogo: !!(await page.locator('.auth-logo').count()),
    hasH1: (await page.locator('.auth-card h1').textContent()).trim(),
  };
  await page.fill('#name', 'UI Phase User');
  await page.fill('#email', email);
  await page.fill('#password', 'password123');
  await page.click('.auth-card button.btn-primary');
  await page.waitForURL('**/dashboard', { timeout: 12000 });
  await page.waitForTimeout(1500);
  out.dashboard = {
    url: page.url(),
    greeting: (await page.locator('.dashboard-header h1').textContent()).trim(),
    statCards: await page.locator('.stat-card').count(),
    sidebar: await page.locator('.sidebar-link').count(),
  };

  // 2. Create a project via the dashboard quick action
  await page.click('.dashboard-actions-row .btn-primary');
  await page.waitForTimeout(400);
  await page.fill('.create-project-form input', 'Website Redesign');
  await page.fill('.create-project-form textarea', 'Modernize the marketing site.');
  await page.click('.create-project-form button.btn-primary');
  await page.waitForTimeout(1500);
  out.projectCards = await page.locator('.dashboard-project-card').count();

  // 3. Projects page shows the card with actions
  await page.goto('http://localhost:5173/projects');
  await page.waitForTimeout(1500);
  out.projectsPage = {
    cards: await page.locator('.project-card').count(),
    viewBtn: await page.locator('.project-card .btn-secondary').count(),
    editBtn: await page.locator('.project-card .btn-edit').count(),
    deleteBtn: await page.locator('.project-card .btn-delete').count(),
  };

  // 4. Create a task via Tasks page, check filters exist
  await page.goto('http://localhost:5173/tasks');
  await page.waitForTimeout(800);
  out.tasksPage = {
    search: await page.locator('.task-search input').count(),
    selects: await page.locator('.task-filters select').count(),
  };
  await page.click('.page-header .btn-primary');
  await page.waitForTimeout(600);
  await page.fill('#task-title', 'Design landing page');
  await page.selectOption('#task-project', { index: 1 });
  await page.selectOption('#task-priority', 'high');
  await page.click('.task-form button[type=submit]');
  await page.waitForTimeout(1500);
  out.taskCards = await page.locator('.task-card').count();

  // 5. Search filter works
  await page.fill('.task-search input', 'landing');
  await page.waitForTimeout(400);
  out.filteredTasks = await page.locator('.task-card').count();
  await page.fill('.task-search input', '');

  // 6. Deadlines page renders groups
  await page.goto('http://localhost:5173/deadlines');
  await page.waitForTimeout(1200);
  out.deadlines = await page.locator('.deadline-group').count();

  // 7. Refresh preserves session
  await page.reload();
  await page.waitForTimeout(1800);
  out.afterRefreshUrl = page.url();

  // 8. Logout via sidebar
  await page.click('.sidebar-logout');
  await page.waitForTimeout(1500);
  out.afterLogout = page.url();

  return out;
}

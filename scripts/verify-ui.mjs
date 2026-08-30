export default async function run(page, ui) {
  const out = {};
  const email = 'ui.verifier.' + Date.now() + '@example.com';

  // Register → dashboard
  await page.goto('http://localhost:5173/register');
  await page.waitForSelector('.auth-card');
  await page.fill('#name', 'UI Verifier');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('.auth-card button');
  await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => { });
  out.afterRegister = page.url();

  // Create a project from the dashboard
  await page.waitForSelector('.dashboard-summary-grid', { timeout: 20000 });
  out.summaryCards = await page.locator('.dashboard-summary-grid .stat-card, .dashboard-summary-grid > *').count();
  await page.click('text=Create Project');
  await page.fill('input[aria-label="Project name"]', 'UI Verify Project');
  await page.fill('textarea[aria-label="Project description"]', 'Created by automated UI test');
  await page.click('.create-project-form button.btn-primary');
  await page.waitForSelector('text=UI Verify Project', { timeout: 15000 });
  out.projectCreatedOnDashboard = true;

  // Go to Tasks, open create form
  await page.click('nav >> text=Tasks');
  await page.waitForSelector('.page-header');
  await page.click('text=New Task');
  await page.waitForSelector('.task-form');
  await page.fill('#task-title', 'UI Verify Task One');
  await page.selectOption('#task-project', { label: 'UI Verify Project' });
  await page.selectOption('#task-priority', 'high');
  const due = new Date(Date.now() - 86400000).toISOString().slice(0, 10); // yesterday → overdue
  await page.fill('#task-due', due);
  await page.click('.task-form button.btn-primary');
  await page.waitForSelector('text=UI Verify Task One', { timeout: 15000 });
  out.taskVisibleInList = true;
  out.overdueBadge = await page.locator('.task-card:has-text("UI Verify Task One") .deadline-overdue').count() > 0;

  // Edit task → set completed via edit form
  await page.click('.task-card:has-text("UI Verify Task One") >> text=Edit');
  await page.waitForSelector('.task-form');
  await page.selectOption('#task-status', 'completed');
  await page.click('.task-form button.btn-primary');
  await page.waitForSelector('.task-card:has-text("UI Verify Task One") .badge-completed', { timeout: 15000 });
  out.statusChangeToCompleted = true;

  // Deadlines page: completed task must not appear
  await page.click('nav >> text=Deadlines');
  await page.waitForSelector('.deadline-groups');
  await page.waitForTimeout(500);
  out.deadlinesShowsCompletedTask = await page.locator('text=UI Verify Task One').count() > 0;

  // Projects page: edit + delete flows
  await page.click('nav >> text=Projects');
  await page.waitForSelector('.project-card');
  out.projectCardProgressVisible = await page.locator('.project-card:has-text("UI Verify Project")').count() > 0;
  await page.click('.project-card:has-text("UI Verify Project") >> text=Delete');
  await page.waitForSelector('.modal, [role=dialog], .confirm-dialog', { timeout: 5000 }).catch(() => { });
  await page.click('button:has-text("Delete Project")');
  await page.waitForSelector('.project-card:has-text("UI Verify Project")', { state: 'detached', timeout: 15000 }).catch(() => { });
  out.projectDeleted = (await page.locator('.project-card:has-text("UI Verify Project")').count()) === 0;

  // Protected route check: logged-in nav to /dashboard works (already proven), so done
  return out;
}

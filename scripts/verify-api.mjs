// E2E API verification for the Project Management Tool core.
// Usage: node scripts/verify-api.mjs
const BASE = 'http://localhost:5000/api';
let cookie = '';
const results = [];

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}

function check(name, cond, extra = '') {
  results.push(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`);
  if (!cond) process.exitCode = 1;
}

// ── Auth (reuse a fresh account) ──
const email = `verify.${Date.now()}@example.com`;
const reg = await call('POST', '/auth/register', { name: 'API Verifier', email, password: 'secret123' });
check('register 201', reg.status === 201);

const noAuth = await fetch(`${BASE}/projects`);
check('projects requires auth (401)', noAuth.status === 401);

// ── Projects CRUD ──
const created = await call('POST', '/projects', { name: 'Verify Project Alpha', description: 'First test project' });
check('create project 201', created.status === 201);
const projectId = created.data.project._id;

const created2 = await call('POST', '/projects', { name: 'Verify Project Beta' });
check('create second project 201', created2.status === 201);

const list = await call('GET', '/projects');
check('list projects shows 2', list.status === 200 && list.data.projects.length === 2);

const updated = await call('PUT', `/projects/${projectId}`, { name: 'Verify Project Alpha (renamed)' });
check('update project 200 + new name', updated.status === 200 && updated.data.project.name.includes('renamed'));

// ── Tasks CRUD + status/priority/dueDate ──
const t1 = await call('POST', '/tasks', {
  title: 'Overdue task', project: projectId, priority: 'high', status: 'todo',
  dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
});
check('create task 201', t1.status === 201);
check('task is overdue', t1.data.task.deadlineStatus === 'overdue', t1.data.task.deadlineStatus);
const t1id = t1.data.task._id;

const t2 = await call('POST', '/tasks', {
  title: 'Due today task', project: projectId, priority: 'medium',
  dueDate: new Date().toISOString().slice(0, 10),
});
check('due-today detected', t2.data.task.deadlineStatus === 'due-today', t2.data.task.deadlineStatus);
const t2id = t2.data.task._id;

const t3 = await call('POST', '/tasks', { title: 'Upcoming task', project: projectId, priority: 'low', dueDate: new Date(Date.now() + 7 * 86400000).toISOString() });
check('upcoming detected', t3.data.task.deadlineStatus === 'upcoming', t3.data.task.deadlineStatus);

const t4 = await call('POST', '/tasks', { title: 'No deadline task', project: projectId });
check('no-deadline detected', t4.data.task.deadlineStatus === 'no-deadline', t4.data.task.deadlineStatus);
const t4id = t4.data.task._id;

const badTask = await call('POST', '/tasks', { title: 'Bad status', project: projectId, status: 'bogus' });
check('invalid status rejected 400', badTask.status === 400);

const allTasks = await call('GET', '/tasks');
check('list tasks = 4', allTasks.data.tasks?.length === 4);

const projTasks = await call('GET', `/projects/${projectId}/tasks`);
check('nested project tasks route works', projTasks.status === 200 && projTasks.data.tasks.length === 4);

// Update status → completed
const done = await call('PUT', `/tasks/${t2id}`, { status: 'completed' });
check('update status 200 + completed', done.status === 200 && done.data.task.status === 'completed');

const upd2 = await call('PUT', `/tasks/${t4id}`, { priority: 'high', title: 'No deadline task (edited)' });
check('update priority + title', upd2.status === 200 && upd2.data.task.priority === 'high');

// ── Summary & stats ──
const sum = await call('GET', `/projects/${projectId}/summary`);
const s = sum.data;
check('summary totals', s.totalTasks === 4 && s.completedTasks === 1, JSON.stringify({ total: s.totalTasks, done: s.completedTasks }));
check('summary progress = 25%', s.progress === 25, String(s.progress));
check('summary overdue = 1', s.overdueTasks === 1);

// ── Deadlines endpoint ──
const dl = await call('GET', '/tasks/deadlines');
const dlTasks = dl.data.tasks || [];
check('deadlines: completed task excluded', !dlTasks.some((t) => t._id === t2id));
check('deadlines: contains overdue + upcoming', dlTasks.some((t) => t.deadlineStatus === 'overdue') && dlTasks.some((t) => t.deadlineStatus === 'upcoming'));

// ── Task deletion ──
const delT = await call('DELETE', `/tasks/${t1id}`);
check('delete task 200', delT.status === 200);
const afterDel = await call('GET', '/tasks');
check('task removed from list', afterDel.data.tasks.length === 3);

// ── Project delete cascades to its tasks ──
const delP = await call('DELETE', `/projects/${created2.data.project._id}`);
check('delete empty project 200', delP.status === 200);

// Create + delete a project that has tasks to prove cascade
const tmp = await call('POST', '/projects', { name: 'Cascade Check' });
await call('POST', '/tasks', { title: 'Orphan candidate', project: tmp.data.project._id });
await call('DELETE', `/projects/${tmp.data.project._id}`);
const finalTasks = await call('GET', '/tasks');
check('cascade: no orphaned tasks remain', !finalTasks.data.tasks.some((t) => t.title === 'Orphan candidate'), `count=${finalTasks.data.tasks.length}`);

// logout
await call('POST', '/auth/logout');
const meAfter = await fetch(`${BASE}/auth/me`, { headers: { Cookie: cookie } });
check('logout clears session (401 on /me)', meAfter.status === 401);

console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} checks passed`);

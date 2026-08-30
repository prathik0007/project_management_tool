import { useState, useEffect, useCallback, useMemo } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskForm from '../components/TaskForm.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { SkeletonCard, SkeletonRow } from '../components/Skeletons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'completed' || status === 'done') return false;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

export default function Tasks() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View mode: 'list' | 'board'
  const [viewMode, setViewMode] = useState('list');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        tasksAPI.getAll().catch(() => ({ tasks: [] })),
        projectsAPI.getAll().catch(() => ({ projects: [] })),
        usersAPI.getAll().catch(() => ({ users: [] })),
      ]);
      setTasks(tRes.tasks || []);
      setProjects(pRes.projects || []);
      setUsers(uRes.users || []);
    } catch {
      setError('Unable to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description && task.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // Status
      if (statusFilter !== 'ALL') {
        const s = task.status || 'todo';
        if (s.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Priority
      if (priorityFilter !== 'ALL') {
        const p = task.priority || 'medium';
        if (p.toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Project
      if (projectFilter !== 'ALL') {
        const pId = task.project?._id || task.project?.id || task.project || task.projectId;
        if (String(pId) !== String(projectFilter)) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const handleToggleTask = async (task) => {
    const isDone = task.status === 'completed' || task.status === 'done';
    const newStatus = isDone ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task._id || task.id, { status: newStatus });
      showToast(isDone ? 'Task marked as To Do' : 'Task completed! 🎉', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleMoveStatus = async (task, targetStatus) => {
    if (task.status === targetStatus) return;
    try {
      await tasksAPI.update(task._id || task.id, { status: targetStatus });
      showToast(`Task moved to ${targetStatus.replace('_', ' ')}`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to move task', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await tasksAPI.delete(taskToDelete._id || taskToDelete.id);
      showToast('Task deleted successfully', 'info');
      setTaskToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Kanban column buckets
  const todoTasks = filteredTasks.filter(
    (t) => !t.status || t.status === 'todo' || t.status === 'to_do'
  );
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'in-progress'
  );
  const doneTasks = filteredTasks.filter(
    (t) => t.status === 'completed' || t.status === 'done'
  );

  return (
    <div className="page-container tasks-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">
            Track, filter, and complete team deliverables across projects.
          </p>
        </div>

        <div className="header-actions">
          {/* View Mode Toggle Switch */}
          <div className="view-mode-toggle" role="group" aria-label="View toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <Icon name="list" size={15} />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              <Icon name="kanban" size={15} />
              <span>Board</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          >
            <Icon name="plus" size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-sm btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <section className="tasks-toolbar card" aria-label="Task Filters">
        <div className="toolbar-search">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="toolbar-filters">
          <div className="filter-group">
            <label htmlFor="filterStatus">Status:</label>
            <select
              id="filterStatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterPriority">Priority:</label>
            <select
              id="filterPriority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterProject">Project:</label>
            <select
              id="filterProject"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || projectFilter !== 'ALL') && (
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setProjectFilter('ALL');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Main View Area */}
      {loading ? (
        viewMode === 'list' ? (
          <div className="skeleton-list-rows">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <div className="kanban-board">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )
      ) : filteredTasks.length === 0 ? (
        searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || projectFilter !== 'ALL' ? (
          <EmptyState
            icon="search"
            title="No tasks match your filters"
            message="Try clearing or adjusting your search criteria and filter selections."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setProjectFilter('ALL');
            }}
          />
        ) : (
          <EmptyState
            icon="check"
            title="No tasks yet"
            message="Create a task to keep your deliverables organized and on schedule."
            actionLabel="+ Create Task"
            onAction={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          />
        )
      ) : viewMode === 'list' ? (
        /* List View */
        <TaskList
          tasks={filteredTasks}
          onToggle={handleToggleTask}
          onEdit={(task) => {
            setEditingTask(task);
            setIsModalOpen(true);
          }}
          onDelete={(id) => {
            const t = tasks.find((item) => (item._id || item.id) === id);
            setTaskToDelete(t || { id });
          }}
        />
      ) : (
        /* Kanban Board View */
        <div className="kanban-board">
          {/* Column: TO DO */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="column-title-group">
                <span className="column-dot dot-todo" />
                <h3>To Do</h3>
              </div>
              <span className="column-count">{todoTasks.length}</span>
            </div>

            <div className="kanban-column-content">
              {todoTasks.length === 0 ? (
                <div className="kanban-column-empty">No tasks in To Do</div>
              ) : (
                todoTasks.map((t) => renderKanbanCard(t))
              )}
            </div>
          </div>

          {/* Column: IN PROGRESS */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="column-title-group">
                <span className="column-dot dot-inprogress" />
                <h3>In Progress</h3>
              </div>
              <span className="column-count">{inProgressTasks.length}</span>
            </div>

            <div className="kanban-column-content">
              {inProgressTasks.length === 0 ? (
                <div className="kanban-column-empty">No active tasks</div>
              ) : (
                inProgressTasks.map((t) => renderKanbanCard(t))
              )}
            </div>
          </div>

          {/* Column: DONE */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="column-title-group">
                <span className="column-dot dot-completed" />
                <h3>Done</h3>
              </div>
              <span className="column-count">{doneTasks.length}</span>
            </div>

            <div className="kanban-column-content">
              {doneTasks.length === 0 ? (
                <div className="kanban-column-empty">No completed tasks yet</div>
              ) : (
                doneTasks.map((t) => renderKanbanCard(t))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
        <TaskForm
          task={editingTask}
          projects={projects}
          users={users}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingTask(null);
            loadData();
          }}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title || 'this task'}"? This action cannot be undone.`}
        confirmText="Delete Task"
        danger
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );

  function renderKanbanCard(t) {
    const overdue = isOverdue(t.dueDate, t.status);
    const assigneeInitials = (t.assignedTo?.name || 'U').slice(0, 2).toUpperCase();

    return (
      <div key={t._id || t.id} className="kanban-card">
        <div className="kanban-card-top">
          <span className={`badge badge-${t.priority || 'medium'}`}>
            {t.priority || 'medium'}
          </span>
          <div className="kanban-card-actions">
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => {
                setEditingTask(t);
                setIsModalOpen(true);
              }}
              title="Edit task"
            >
              <Icon name="edit" size={13} />
            </button>
            <button
              type="button"
              className="icon-action-btn danger"
              onClick={() => setTaskToDelete(t)}
              title="Delete task"
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>

        <h4 className="kanban-card-title">{t.title}</h4>
        {t.description && <p className="kanban-card-desc">{t.description}</p>}

        <div className="kanban-card-footer">
          {t.project?.name && (
            <span className="kanban-project-tag">
              <Icon name="folder" size={12} />
              {t.project.name}
            </span>
          )}

          <div className="kanban-card-meta">
            {t.dueDate && (
              <span className={`kanban-due-date ${overdue ? 'date-overdue' : ''}`}>
                <Icon name="calendar" size={12} />
                {formatDate(t.dueDate)}
              </span>
            )}
            {t.assignedTo?.name && (
              <div className="user-avatar-tiny" title={t.assignedTo.name}>
                {assigneeInitials}
              </div>
            )}
          </div>
        </div>

        {/* Quick Move Status Row */}
        <div className="kanban-move-row">
          {t.status !== 'todo' && (
            <button
              type="button"
              className="kanban-move-btn"
              onClick={() => handleMoveStatus(t, 'todo')}
            >
              ← To Do
            </button>
          )}
          {t.status !== 'in_progress' && (
            <button
              type="button"
              className="kanban-move-btn"
              onClick={() => handleMoveStatus(t, 'in_progress')}
            >
              • In Progress
            </button>
          )}
          {t.status !== 'completed' && t.status !== 'done' && (
            <button
              type="button"
              className="kanban-move-btn"
              onClick={() => handleMoveStatus(t, 'completed')}
            >
              ✓ Complete →
            </button>
          )}
        </div>
      </div>
    );
  }
}

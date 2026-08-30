import TaskItem from './TaskItem.jsx';
import EmptyState from './EmptyState.jsx';
import Skeletons from './Skeletons.jsx';

function TaskList({ tasks, loading, error, onRefresh, viewMode = 'list' }) {
  if (loading) return <Skeletons count={4} rows={viewMode === 'list'} type={viewMode === 'kanban' ? 'card' : 'row'} />;

  if (error) return <div className="page-error"><p>{error}</p></div>;

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="No tasks match your filters"
        message="Try adjusting your search criteria or create a new task."
      />
    );
  }

  if (viewMode === 'kanban') {
    const todoTasks = tasks.filter((t) => t.status === 'todo');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return (
      <div className="kanban-board">
        {/* To Do Column */}
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
              todoTasks.map((task) => (
                <TaskItem key={task._id} task={task} onRefresh={onRefresh} viewMode="kanban" />
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
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
              <div className="kanban-column-empty">No tasks in progress</div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskItem key={task._id} task={task} onRefresh={onRefresh} viewMode="kanban" />
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <div className="column-title-group">
              <span className="column-dot dot-completed" />
              <h3>Completed</h3>
            </div>
            <span className="column-count">{completedTasks.length}</span>
          </div>
          <div className="kanban-column-content">
            {completedTasks.length === 0 ? (
              <div className="kanban-column-empty">No completed tasks</div>
            ) : (
              completedTasks.map((task) => (
                <TaskItem key={task._id} task={task} onRefresh={onRefresh} viewMode="kanban" />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-wrapper">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onRefresh={onRefresh} viewMode="list" />
      ))}
    </div>
  );
}

export default TaskList;

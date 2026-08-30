import TaskItem from './TaskItem.jsx';
import EmptyState from './EmptyState.jsx';
import { SkeletonRow } from './Skeletons.jsx';

function TaskList({
  tasks = [],
  loading = false,
  error = '',
  onRefresh,
  onToggle,
  onEdit,
  onDelete,
  viewMode = 'list',
}) {
  if (loading) {
    return (
      <div className="skeleton-list-rows">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="No tasks found"
        message="No tasks match the current view criteria."
      />
    );
  }

  return (
    <div className="task-list-wrapper">
      {tasks.map((task) => (
        <TaskItem
          key={task._id || task.id}
          task={task}
          onRefresh={onRefresh}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}

export default TaskList;

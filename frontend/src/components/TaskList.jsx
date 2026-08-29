import TaskItem from './TaskItem.jsx';
import EmptyState from './EmptyState.jsx';
import Skeletons from './Skeletons.jsx';
import { Icon } from './Icons.jsx';

// TaskList renders the task list or appropriate empty/loading/error states.
function TaskList({ tasks, loading, error, onRefresh }) {
  if (loading) return <Skeletons count={3} rows />;

  if (error) return <p className="error-text">{error}</p>;

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="No tasks yet"
        message="Create your first task to start tracking your work."
      />
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

export default TaskList;

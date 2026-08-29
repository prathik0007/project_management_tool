import TaskItem from './TaskItem.jsx';

// TaskList renders the list of tasks or appropriate empty/loading/error states.
// Props:
//   tasks     - array of task objects
//   loading   - boolean — show spinner while fetching
//   error     - string error message from the API
//   onRefresh - callback to re-fetch the list (passed down to TaskItem)
function TaskList({ tasks, loading, error, onRefresh }) {
  if (loading) {
    return <p className="loading-text">Loading tasks...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks found.</p>
        <p className="muted">Create your first task using the form above.</p>
      </div>
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

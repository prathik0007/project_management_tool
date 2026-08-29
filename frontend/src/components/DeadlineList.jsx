import TaskItem from './TaskItem.jsx';

const GROUPS = [
  { key: 'overdue', title: 'Overdue', empty: 'No overdue tasks.' },
  { key: 'due-today', title: 'Due Today', empty: 'No tasks due today.' },
  { key: 'upcoming', title: 'Upcoming', empty: 'No upcoming deadlines.' },
];

function DeadlineList({ tasks, loading, error, onRefresh }) {
  if (loading) return <p className="loading-text">Loading deadlines...</p>;
  if (error) return <p className="error-text">{error}</p>;
  return <div className="deadline-groups">{GROUPS.map((group) => {
    const groupTasks = tasks.filter((task) => task.deadlineStatus === group.key);
    return <section className="deadline-group" key={group.key}>
      <h2>{group.title} ({groupTasks.length})</h2>
      {groupTasks.length === 0 ? <p className="deadline-empty">{group.empty}</p> : <div className="task-list">{groupTasks.map((task) => <TaskItem key={task._id} task={task} onRefresh={onRefresh} />)}</div>}
    </section>;
  })}</div>;
}

export default DeadlineList;

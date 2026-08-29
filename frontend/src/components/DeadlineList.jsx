import TaskItem from './TaskItem.jsx';
import Skeletons from './Skeletons.jsx';
import EmptyState from './EmptyState.jsx';

const GROUPS = [
  { key: 'overdue', title: 'Overdue', empty: 'Nothing overdue. Great job staying on top of things!' },
  { key: 'due-today', title: 'Due Today', empty: 'No tasks due today.' },
  { key: 'upcoming', title: 'Upcoming', empty: 'No upcoming deadlines.' },
];

function DeadlineList({ tasks, loading, error, onRefresh }) {
  if (loading) return <Skeletons count={3} />;
  if (error) return <p className="error-text">{error}</p>;
  return <div className="deadline-groups">{GROUPS.map((group) => {
    const groupTasks = tasks.filter((task) => task.deadlineStatus === group.key);
    return <section className={`deadline-group${groupTasks.length === 0 ? ' deadline-group--empty' : ''}`} key={group.key}>
      <div className="deadline-group-header">
        <span className={`deadline-dot deadline-dot--${group.key}`} aria-hidden="true"></span>
        <h2>{group.title}</h2>
        <span className="deadline-count">{groupTasks.length}</span>
      </div>
      {groupTasks.length === 0 ? <p className="deadline-empty">{group.empty}</p> : <div className="task-list">{groupTasks.map((task) => <TaskItem key={task._id} task={task} onRefresh={onRefresh} />)}</div>}
    </section>;
  })}</div>;
}

export default DeadlineList;

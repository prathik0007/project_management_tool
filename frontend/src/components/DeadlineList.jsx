import TaskItem from './TaskItem.jsx';
import Skeletons from './Skeletons.jsx';
import EmptyState from './EmptyState.jsx';
import { Icon } from './Icons.jsx';

const GROUPS = [
  { key: 'overdue', title: 'Overdue Tasks', empty: 'Nothing overdue. Great job staying on top of work!', icon: 'alert', toneClass: 'deadline-group-overdue' },
  { key: 'due-today', title: 'Due Today', empty: 'No tasks due today.', icon: 'clock', toneClass: 'deadline-group-today' },
  { key: 'upcoming', title: 'Upcoming Deadlines', empty: 'No upcoming deadlines scheduled.', icon: 'calendar', toneClass: 'deadline-group-upcoming' },
];

function DeadlineList({ tasks, loading, error, onRefresh }) {
  if (loading) return <Skeletons count={3} rows />;
  if (error) return <div className="page-error"><p>{error}</p></div>;

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="No deadlines found"
        message="Assign due dates to your tasks to track upcoming deadlines here."
      />
    );
  }

  return (
    <div className="deadline-groups">
      {GROUPS.map((group) => {
        const groupTasks = tasks.filter((task) => task.deadlineStatus === group.key);
        return (
          <section
            className={`deadline-section ${group.toneClass} ${groupTasks.length === 0 ? 'empty' : ''}`}
            key={group.key}
          >
            <div className="deadline-section-header">
              <div className="deadline-section-title">
                <span className="deadline-icon-wrapper">
                  <Icon name={group.icon} size={18} />
                </span>
                <h2>{group.title}</h2>
              </div>
              <span className="deadline-badge-count">{groupTasks.length}</span>
            </div>

            {groupTasks.length === 0 ? (
              <div className="deadline-section-empty">
                <p>{group.empty}</p>
              </div>
            ) : (
              <div className="deadline-task-list">
                {groupTasks.map((task) => (
                  <TaskItem key={task._id} task={task} onRefresh={onRefresh} viewMode="list" />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default DeadlineList;

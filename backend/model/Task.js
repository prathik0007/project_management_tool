import mongoose from 'mongoose';

// Define the structure of a Task document in MongoDB
const taskSchema = new mongoose.Schema(
  {
    // The task title — required and cannot be blank
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },

    // Optional longer description of what the task involves
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Reference to the Project this task belongs to.
    // Every task MUST belong to exactly one project.
    // ref: 'Project' allows .populate('project') to fetch the full project object.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },

    // Reference to the User this task is assigned to.
    // This is optional — a task can exist without being assigned.
    // ref: 'User' allows .populate('assignedTo') to fetch the full user object.
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // The current progress state of the task.
    // enum restricts the value to only these three strings.
    // Default is 'todo' when a task is first created.
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'completed'],
        message: 'Status must be todo, in-progress, or completed',
      },
      default: 'todo',
    },

    // The urgency level of the task.
    // enum restricts the value to only these three strings.
    // Default is 'medium'.
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },

    // Optional deadline for the task.
    // Stored as a Date object in MongoDB.
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true,
    // Computed fields are returned in API responses but are never stored.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const getDayBounds = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
};

// deadlineStatus is dynamic and is not persisted in MongoDB.
taskSchema.virtual('deadlineStatus').get(function getDeadlineStatus() {
  if (!this.dueDate) return 'no-deadline';
  if (this.status === 'completed') return 'completed';

  const { today, tomorrow } = getDayBounds();
  const dueDate = new Date(this.dueDate);
  if (dueDate < today) return 'overdue';
  if (dueDate < tomorrow) return 'due-today';
  return 'upcoming';
});

const Task = mongoose.model('Task', taskSchema);

export default Task;

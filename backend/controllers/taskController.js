import mongoose from 'mongoose';
import Task from '../model/Task.js';
import Project from '../model/Project.js';
import User from '../model/User.js';

// ─── Helper: Check if a MongoDB ID is valid ────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Helper: Verify project exists and is owned by the logged-in user ──────
// Returns the project on success, or sends an error response and returns null
const getOwnedProject = async (projectId, userId, res) => {
  // 1. Validate ID format
  if (!isValidId(projectId)) {
    res.status(400).json({ message: 'Invalid project ID format' });
    return null;
  }

  // 2. Find the project
  const project = await Project.findById(projectId);

  // 3. Check it exists
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }

  // 4. Check ownership — the logged-in user must own this project
  if (project.owner.toString() !== userId.toString()) {
    res.status(403).json({ message: 'Not authorized to manage tasks in this project' });
    return null;
  }

  return project;
};

// ─── CREATE TASK ───────────────────────────────────────────────────────────
// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    // 1. title is required
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // 2. project is required
    if (!project) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // 3. Verify project exists and the logged-in user owns it
    const ownedProject = await getOwnedProject(project, req.user.id, res);
    if (!ownedProject) return; // getOwnedProject already sent the error response

    // 4. If assignedTo is provided, validate that the user actually exists
    if (assignedTo) {
      if (!isValidId(assignedTo)) {
        return res.status(400).json({ message: 'Invalid assignedTo user ID format' });
      }
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }

    // 5. Validate dueDate if provided
    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: 'Invalid due date format' });
    }

    // 6. Create the task in MongoDB
    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      project,                           // The project this task belongs to
      assignedTo: assignedTo || null,    // null if not provided
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    // 7. Populate the response so it shows project name and assigned user name
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
    });
  } catch (error) {
    // Handle Mongoose enum validation errors (e.g., invalid status/priority value)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// ─── GET ALL TASKS (for the logged-in user's projects) ─────────────────────
// GET /api/tasks
export const getAllTasks = async (req, res) => {
  try {
    // Step 1: Find all projects owned by the logged-in user
    const userProjects = await Project.find({ owner: req.user.id }).select('_id');

    // Step 2: Extract just the IDs into a plain array
    const projectIds = userProjects.map((p) => p._id);

    // Step 3: Find all tasks where the task's project field is in that list of IDs
    // This guarantees: only tasks from the user's own projects are returned
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 }); // Newest tasks first

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Get all tasks error:', error.message);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// ─── GET TASKS FOR A SPECIFIC PROJECT ─────────────────────────────────────
// GET /api/projects/:projectId/tasks
export const getTasksByProject = async (req, res) => {
  try {
    // 1. Verify the project exists and is owned by the logged-in user
    const project = await getOwnedProject(req.params.projectId, req.user.id, res);
    if (!project) return;

    // 2. Get all tasks belonging to that project
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      project: project.name,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks by project error:', error.message);
    res.status(500).json({ message: 'Server error while fetching project tasks' });
  }
};

// ─── GET SINGLE TASK ───────────────────────────────────────────────────────
// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    // 1. Validate task ID format
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    // 2. Find the task — populate project and assignedTo
    const task = await Task.findById(req.params.id)
      .populate('project', 'name owner')
      .populate('assignedTo', 'name email');

    // 3. Task doesn't exist
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 4. Authorization: check that the logged-in user owns the project the task belongs to
    // task.project.owner was populated, so we can access it directly
    if (task.project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task by ID error:', error.message);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
};

// ─── UPDATE TASK ───────────────────────────────────────────────────────────
// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    // 1. Validate task ID format
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    // 2. Find the task (populate project to get the owner field)
    const task = await Task.findById(req.params.id).populate('project', 'owner');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 3. Check ownership — only the project owner can update this task
    if (task.project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // 4. Apply only the fields that were actually sent in the request body
    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ message: 'Task title cannot be empty' });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (assignedTo !== undefined) {
      // Allow setting to null to un-assign
      if (assignedTo === null || assignedTo === '') {
        task.assignedTo = null;
      } else {
        if (!isValidId(assignedTo)) {
          return res.status(400).json({ message: 'Invalid assignedTo user ID format' });
        }
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({ message: 'Assigned user not found' });
        }
        task.assignedTo = assignedTo;
      }
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        task.dueDate = null;
      } else if (isNaN(new Date(dueDate).getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      } else {
        task.dueDate = dueDate;
      }
    }

    // 5. Save — updatedAt is automatically refreshed by Mongoose
    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Update task error:', error.message);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// ─── DELETE TASK ───────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    // 1. Validate task ID format
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    // 2. Find the task (populate project to get the owner)
    const task = await Task.findById(req.params.id).populate('project', 'owner');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 3. Check ownership — only the project owner can delete this task
    if (task.project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // 4. Delete the task permanently from MongoDB
    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

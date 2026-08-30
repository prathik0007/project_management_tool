import mongoose from 'mongoose';
import Project from '../model/Project.js';
import Task from '../model/Task.js';

// ─── Helper: Check if a MongoDB ID is valid ────────────────────────────────
// If someone passes "abc" instead of a real ObjectId, this prevents a crash
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── CREATE PROJECT ────────────────────────────────────────────────────────
// POST /api/projects
// Creates a new project owned by the currently logged-in user
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate: name is required
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Create the project in MongoDB
    // The owner is always set from req.user.id (set by the auth middleware)
    // This prevents a client from spoofing someone else's user ID
    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({ message: 'Server error while creating project' });
  }
};

// ─── GET ALL PROJECTS ──────────────────────────────────────────────────────
// GET /api/projects
// Returns only the projects that belong to the currently logged-in user
export const getProjects = async (req, res) => {
  try {
    // Filter by owner — only returns documents where owner === logged-in user's ID
    // This means a user can NEVER see another user's projects
    const projects = await Project.find({ owner: req.user.id }).sort({
      createdAt: -1, // Newest projects first
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error.message);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

// ─── GET SINGLE PROJECT ────────────────────────────────────────────────────
// GET /api/projects/:id
// Returns a single project — only if it belongs to the logged-in user
// GET /api/projects/:projectId/summary
// Progress and deadline counts are calculated from current Task documents.
export const getProjectSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!isValidId(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;
    const todoTasks = tasks.filter((task) => task.status === 'todo').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const overdueTasks = tasks.filter((task) => task.deadlineStatus === 'overdue').length;
    const upcomingTasks = tasks.filter((task) => task.deadlineStatus === 'upcoming').length;

    res.status(200).json({
      project,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      progress,
      overdueTasks,
      upcomingTasks,
    });
  } catch (error) {
    console.error('Get project summary error:', error.message);
    res.status(500).json({ message: 'Server error while fetching project summary' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    // 1. Validate the format of the ID in the URL
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    // 2. Find the project by its ID
    const project = await Project.findById(req.params.id);

    // 3. If project doesn't exist in the database at all
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 4. Check ownership — project.owner is the stored user ID
    // We convert to string because one is an ObjectId and one is a string
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Get project by ID error:', error.message);
    res.status(500).json({ message: 'Server error while fetching project' });
  }
};

// ─── UPDATE PROJECT ────────────────────────────────────────────────────────
// PUT /api/projects/:id
// Updates name and/or description — only if the project belongs to logged-in user
export const updateProject = async (req, res) => {
  try {
    // 1. Validate the ID format
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    // 2. Find the project
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 3. Check that the logged-in user is the owner
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // 4. Apply updates — only update fields that were actually sent
    const { name, description } = req.body;

    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ message: 'Project name cannot be empty' });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    // 5. Save — the updatedAt timestamp is automatically updated
    const updatedProject = await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error.message);
    res.status(500).json({ message: 'Server error while updating project' });
  }
};

// ─── DELETE PROJECT ────────────────────────────────────────────────────────
// DELETE /api/projects/:id
// Permanently deletes a project — only if it belongs to the logged-in user
export const deleteProject = async (req, res) => {
  try {
    // 1. Validate the ID format
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    // 2. Find the project
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 3. Check that the logged-in user is the owner
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // 4. Delete the project's tasks first, then the project itself
    // (prevents orphaned tasks pointing at a deleted project)
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};

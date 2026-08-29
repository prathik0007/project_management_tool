import express from 'express';
import {
  createTask,
  getAllTasks,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import protect from '../middleware/auth.js';

// ─── Router for /api/tasks ──────────────────────────────────────────────────
// mergeParams: true allows this router to access URL params from a parent router.
// This is required for the nested route: /api/projects/:projectId/tasks
// Without it, req.params.projectId would be undefined.
const router = express.Router({ mergeParams: true });

// All task routes require authentication
router.use(protect);

// When this router is mounted at /api/projects/:projectId/tasks,
// a GET to that URL hits the root '/' of this router.
// We use a conditional inside: if projectId param exists → getTasksByProject
//                               otherwise                → getAllTasks
router.route('/').get((req, res, next) => {
  // If the URL contains :projectId, return tasks for that specific project
  if (req.params.projectId) {
    return getTasksByProject(req, res, next);
  }
  // Otherwise return all tasks across all the user's projects
  return getAllTasks(req, res, next);
}).post(createTask);

// GET    /api/tasks/:id → Get a single task by ID
// PUT    /api/tasks/:id → Update a task by ID
// DELETE /api/tasks/:id → Delete a task by ID
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

export default router;

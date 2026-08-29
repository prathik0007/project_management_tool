import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All project routes are protected — the user MUST be logged in
// The "protect" middleware is applied to every route in this file using router.use()
// This means we don't have to add "protect" to each route individually
router.use(protect);

// POST   /api/projects      → Create a new project
// GET    /api/projects      → Get all projects for the logged-in user
router.route('/').post(createProject).get(getProjects);

// GET    /api/projects/:id  → Get a single project by ID
// PUT    /api/projects/:id  → Update a project by ID
// DELETE /api/projects/:id  → Delete a project by ID
router.route('/:id').get(getProjectById).put(updateProject).delete(deleteProject);

export default router;

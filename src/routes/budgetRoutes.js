
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetAnalysis
} = require('../controllers/budgetController');

// Apply auth middleware to all budget routes
router.use(auth);

// Create a new budget
router.post('/', createBudget);

// Get budget analysis (must be above `/:id` route to avoid conflicts)
router.get('/analysis', getBudgetAnalysis);

// Get all budgets (optionally filtered client-side)
router.get('/', getBudgets);

// Update a budget by ID
router.put('/:id', updateBudget);

// Soft delete a budget by ID
router.delete('/:id', deleteBudget);

module.exports = router;

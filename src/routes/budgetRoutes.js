
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
} = require('../controllers/budgetController');


router.use(auth);

// Create a new budget
router.post('/', createBudget);


router.get('/', getBudgets);




module.exports = router;

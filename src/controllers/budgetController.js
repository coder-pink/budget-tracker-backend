
const Budget = require('../models/Budget');
const { startOfMonth, parseISO, isValid } = require('date-fns');

// Helper to normalize month string to start of month date
const normalizeMonth = (monthStr) => {
  try {
    let date = /^\d{4}-\d{2}$/.test(monthStr)
      ? parseISO(`${monthStr}-01`)
      : parseISO(monthStr);

    return isValid(date) ? startOfMonth(date) : null;
  } catch {
    return null;
  }
};

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    const { amount, month } = req.body;

    if (!amount || !month) {
      return res.status(400).json({ message: 'Amount and month are required' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const monthDate = normalizeMonth(month);
    if (!monthDate) {
      return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM or ISO format.' });
    }

    const existingBudget = await Budget.findOne({
      userId,
      month: monthDate,
      isActive: true
    });

    if (existingBudget) {
      return res.status(400).json({
        message: 'An active budget already exists for this month'
      });
    }

    const budget = new Budget({
      userId,
      amount,
      month: monthDate,
      isActive: true
    });

    await budget.save();

    return res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all active budgets for current user
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user?.userId;
    //  console.log('getBudgets for user:', userId); 
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const budgets = await Budget.find({
      userId,
      isActive: true
    }).sort({ month: -1 });

    return res.status(200).json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

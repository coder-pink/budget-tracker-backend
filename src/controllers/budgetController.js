
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const {
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
} = require('date-fns');

const normalizeMonth = (monthStr) => {
  try {
    let date;

    // Handle YYYY-MM (e.g., "2025-05")
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      date = parseISO(`${monthStr}-01`);
    } else {
      // Try to parse as full ISO
      date = parseISO(monthStr);
    }

    return isValid(date) ? startOfMonth(date) : null;
  } catch {
    return null;
  }
};



exports.createBudget = async (req, res) => {
  try {
    const { amount, month } = req.body;

    if (!amount || !month) {
      return res.status(400).json({ message: 'Amount and month are required' });
    }

    const monthDate = normalizeMonth(month);
    if (!monthDate) {
      return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM or full ISO date.' });
    }

    const existingBudget = await Budget.findOne({
      user: req.user.userId,
      month: monthDate,
      isActive: true
    });

    if (existingBudget) {
      return res.status(400).json({
        message: 'An active budget already exists for this month'
      });
    }

    const budget = new Budget({
      user: req.user.userId,
      amount,
      month: monthDate,
      isActive: true
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all active budgets for a user
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.userId, isActive: true });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update budget amount
exports.updateBudget = async (req, res) => {
  try {
    const { amount } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    budget.amount = amount || budget.amount;
    await budget.save();

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Soft delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    budget.isActive = false;
    await budget.save();

    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getBudgetAnalysis = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.userId, isActive: true });
    const analysis = [];

    for (const budget of budgets) {
      const startDate = startOfMonth(budget.month);
      const endDate = endOfMonth(budget.month);

      const expenses = await Transaction.find({
        user: req.user.userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      });

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = budget.amount - totalSpent;
      const percentageUsed = ((totalSpent / budget.amount) * 100).toFixed(2);

      analysis.push({
        budgetId: budget._id,
        month: budget.month,
        budget: budget.amount,
        spent: totalSpent,
        remaining,
        percentageUsed: Number(percentageUsed),
        transactions: expenses.length
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Budget analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

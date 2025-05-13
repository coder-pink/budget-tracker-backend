
const Transaction = require('../models/Transaction');
const { startOfMonth, endOfMonth, isValid } = require('date-fns');

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current month date range
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Fetch transactions for current user and current month
    const transactions = await Transaction.find({
      userId: userId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    let income = 0;
    let expenses = 0;
    const categoryMap = {};

    transactions.forEach(tx => {
      const type = tx.type?.toLowerCase();
      const amount = Number(tx.amount) || 0;
      const category = tx.category || 'Uncategorized';

      if (type === 'income') {
        income += amount;
      } else if (type === 'expense') {
        expenses += amount;
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      }
    });

    const categoryData = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    }));

    return res.json({ income, expenses, categoryData });
  } catch (error) {
    console.error('[Dashboard Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const Transaction = require("../models/Transaction");

exports.createTransaction = async (req, res) => {
  try {
        
    const requiredFields = ['title', 'amount', 'type', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        fields: missingFields 
      });
    }

    if (isNaN(req.body.amount) || req.body.amount <= 0) {
      return res.status(400).json({ 
        error: "Amount must be a positive number" 
      });
    }

    if (!['income', 'expense'].includes(req.body.type)) {
      return res.status(400).json({ 
        error: "Type must be either 'income' or 'expense'" 
      });
    }

    const transaction = new Transaction({ 
      ...req.body, 
      userId: req.user.userId, // ✅ FIXED
      amount: parseFloat(req.body.amount),
      date: req.body.date ? new Date(req.body.date) : new Date()
    });

    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error('Transaction creation error:', err);
    res.status(500).json({ 
      error: "Failed to create transaction",
      details: err.message 
    });
  }
};



exports.getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      type, 
      startDate, 
      endDate, 
      title, 
      description,
      minAmount,
      maxAmount 
    } = req.query;

    const query = { userId: req.user.userId };

    if (category) query.category = category;
    if (type) query.type = type;
    if (title) query.title = { $regex: title, $options: "i" };
    if (description) query.description = { $regex: description, $options: "i" };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      transactions,
      total,
      currentPage: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.user.userId.toString()) { // ✅ FIXED
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { ...req.body, amount: parseFloat(req.body.amount) },
      { new: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.user.userId.toString()) { // ✅ FIXED
      return res.status(403).json({ message: 'Not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const categories = await Transaction.distinct('category', { userId: req.user.userId }); // ✅ FIXED
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

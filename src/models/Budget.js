
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number']
  },

  month: {
    type: Date,
    required: true
  },

  category: {
    type: String,
    trim: true,
    maxlength: 50
  },

  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },

  startDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return !this.endDate || v <= this.endDate;
      },
      message: 'Start date must be before end date'
    }
  },

  endDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return !this.startDate || v >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ❗ Prevent duplicate *active* budgets for same user & month
budgetSchema.index(
  { userId: 1, month: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;

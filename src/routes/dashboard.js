
// const express = require("express");
// const router = express.Router();
// const auth = require("../middleware/auth");
// const Transaction = require("../models/Transaction");

// router.get("/", auth, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const transactions = await Transaction.find({ userId });

//     const income = transactions
//       .filter(tx => tx.type === "income")
//       .reduce((sum, tx) => sum + tx.amount, 0);

//     const expenses = transactions
//       .filter(tx => tx.type === "expense")
//       .reduce((sum, tx) => sum + tx.amount, 0);

//     const categoryData = transactions
//       .filter(tx => tx.type === "expense")
//       .reduce((acc, tx) => {
//         acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
//         return acc;
//       }, {});

//     const formattedCategoryData = Object.entries(categoryData).map(
//       ([category, amount]) => ({ category, amount })
//     );

//     res.json({ income, expenses, balance: income - expenses, categoryData: formattedCategoryData });
//   } catch (err) {
//     console.error("Dashboard error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth'); // if you're using JWT or session auth

router.get('/', authMiddleware, getDashboardData);

module.exports = router;

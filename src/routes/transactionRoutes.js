
const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getCategories,
} = require("../controllers/transactionController");
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction"); // Make sure this is imported

// Apply auth middleware to all routes
router.use(auth);

// Transaction routes
router.route("/")
  .post(createTransaction)
  .get(getTransactions);


// Category route
router.get("/categories", getCategories);

// Update/Delete by ID
router.route("/:id")
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;

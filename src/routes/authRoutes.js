
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');


// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/refresh-token', authController.getAccessToken);

// Protected route example
router.get('/verify', auth, async (req, res) => {
  const User = require('../models/User');
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

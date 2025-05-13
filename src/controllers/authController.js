
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const dotenv = require('dotenv');
dotenv.config();

// Validate presence of env variables
if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
  throw new Error("JWT_SECRET or REFRESH_SECRET is missing in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_EXPIRE = '15m';
const REFRESH_EXPIRE = '7d';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRE });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE });
  return { accessToken, refreshToken };
};

// exports.registerUser = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.array() });
//   }

//   try {
//     const { name, email, password } = req.body;
//     const userExists = await User.findOne({ email });
//     if (userExists) return res.status(400).json({ message: "Email already in use" });

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const newUser = new User({ name, email, password: hashedPassword });

//     const savedUser = await newUser.save();
//     const tokens = generateTokens(savedUser._id);
//     savedUser.refreshToken = tokens.refreshToken;
//     await savedUser.save();

//     res.cookie("refreshToken", tokens.refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//     });

//     res.status(201).json({
//       userId: savedUser._id,
//       accessToken: tokens.accessToken,
//       user: {
//         name: savedUser.name,
//         email: savedUser.email
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    // Check if the user already exists by email
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already in use" });

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, password: hashedPassword });

    const savedUser = await newUser.save();

    // Generate access and refresh tokens
    const tokens = generateTokens(savedUser._id);

    // Set the refresh token in the user model (optional, for persistence in DB)
    savedUser.refreshToken = tokens.refreshToken;
    await savedUser.save();

    // Send the refresh token as a secure, HttpOnly cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only set cookies over HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send back user data and access token
    res.status(201).json({
      userId: savedUser._id,
      accessToken: tokens.accessToken,
      user: {
        name: savedUser.name,
        email: savedUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      userId: user._id,
      accessToken: tokens.accessToken,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: ACCESS_EXPIRE });

    res.status(200).json({
      accessToken: newAccessToken,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

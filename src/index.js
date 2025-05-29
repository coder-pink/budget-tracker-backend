const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboard');
const connectDB = require('./config/db');




dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://budget-tracker-frontend-two.vercel.app',
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    console.error(`Blocked by CORS: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);


connectDB();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

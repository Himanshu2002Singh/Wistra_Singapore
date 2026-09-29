'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const adminMembershipRoutes = require('./routes/adminMembershipRoutes');
const rbacTestRoutes = require('./routes/rbacTestRoutes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'WISTA API is healthy',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'WISTA API database connection issue',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/admin/applications', adminApplicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/memberships', adminMembershipRoutes);
app.use('/api/rbac-test', rbacTestRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
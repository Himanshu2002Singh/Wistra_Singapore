'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const adminMembershipRoutes = require('./routes/adminMembershipRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminUserAccessRoutes = require('./routes/adminUserAccessRoutes');
const adminAuditLogRoutes = require('./routes/adminAuditLogRoutes');
const adminContentRoutes = require('./routes/adminContentRoutes');
const publicContentRoutes = require('./routes/publicContentRoutes');
const rbacTestRoutes = require('./routes/rbacTestRoutes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

const configuredClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedClientOrigins = configuredClientOrigins.length
  ? configuredClientOrigins
  : process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedClientOrigins.includes(origin)),
  // The client authenticates with Bearer tokens; it does not use cross-site cookies.
  credentials: false,
}));

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
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/admin/applications', adminApplicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/memberships', adminMembershipRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/users', adminUserAccessRoutes);
app.use('/api/admin/audit-logs', adminAuditLogRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/content', publicContentRoutes);
app.use('/api/rbac-test', rbacTestRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

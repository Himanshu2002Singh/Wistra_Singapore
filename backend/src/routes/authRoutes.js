'use strict';

const express = require('express');
const router = express.Router();
const { getAdminRoles, register, login, getMe, logout } = require('../controllers/authController');
const authenticateToken = require('../middleware/authenticate');

router.get('/admin-roles', getAdminRoles);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

module.exports = router;

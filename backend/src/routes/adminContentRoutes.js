'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const { listAdminEvents, createAdminEvent, listAdminNews, createAdminNews } = require('../controllers/adminContentController');

router.get('/events', authenticateToken, requirePermission('events.read', 'events.view', 'events.manage'), listAdminEvents);
router.post('/events', authenticateToken, requirePermission('events.create', 'events.manage'), createAdminEvent);
router.get('/news', authenticateToken, requirePermission('news.read', 'news.view', 'news.manage'), listAdminNews);
router.post('/news', authenticateToken, requirePermission('news.create', 'news.manage'), createAdminNews);

module.exports = router;

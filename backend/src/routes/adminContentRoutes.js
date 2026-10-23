'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const {
  listAdminEvents, createAdminEvent, listAdminNews, uploadAdminNewsImage, createAdminNews,
  updateAdminNews, setAdminNewsPublication, deleteAdminNews,
} = require('../controllers/adminContentController');
const { listAdminEventRegistrations, checkInEventRegistration } = require('../controllers/eventRegistrationController');
const { newsImageUpload } = require('../middleware/newsImageUpload');

const denyMemberRole = (req, res, next) => {
  if (req.user?.role?.name === 'MEMBER') {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }
  return next();
};

router.get('/events', authenticateToken, denyMemberRole, requirePermission('events.read', 'events.view', 'events.manage'), listAdminEvents);
router.post('/events', authenticateToken, requirePermission('events.create', 'events.manage'), createAdminEvent);
router.get('/events/:eventId/registrations', authenticateToken, denyMemberRole, requirePermission('events.manage_registrations', 'events.read', 'events.manage'), listAdminEventRegistrations);
router.post('/events/check-in', authenticateToken, requirePermission('events.checkin', 'attendance.manage', 'events.manage'), checkInEventRegistration);
router.get('/news', authenticateToken, denyMemberRole, requirePermission('news.read', 'news.view', 'news.manage'), listAdminNews);
router.post('/news/images', authenticateToken, requirePermission('news.create', 'news.update', 'news.manage'), newsImageUpload, uploadAdminNewsImage);
router.post('/news', authenticateToken, requirePermission('news.create', 'news.manage'), createAdminNews);
router.patch('/news/:id', authenticateToken, requirePermission('news.update', 'news.manage'), updateAdminNews);
router.patch('/news/:id/publication', authenticateToken, requirePermission('news.publish', 'news.manage'), setAdminNewsPublication);
router.delete('/news/:id', authenticateToken, requirePermission('news.delete', 'news.manage'), deleteAdminNews);

module.exports = router;

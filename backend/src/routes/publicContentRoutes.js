'use strict';

const express = require('express');
const { listPublishedEvents, listPublishedNews } = require('../controllers/publicContentController');

const router = express.Router();

router.get('/events', listPublishedEvents);
router.get('/news', listPublishedNews);

module.exports = router;

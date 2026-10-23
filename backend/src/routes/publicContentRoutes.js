'use strict';

const express = require('express');
const { listPublishedEvents, getPublishedEvent, listPublishedNews, getPublishedNewsArticle, getNewsImage } = require('../controllers/publicContentController');

const router = express.Router();

router.get('/events', listPublishedEvents);
router.get('/events/:id', getPublishedEvent);
router.get('/news', listPublishedNews);
router.get('/news/images/:key', getNewsImage);
router.get('/news/:id', getPublishedNewsArticle);

module.exports = router;

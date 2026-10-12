'use strict';

const { Op } = require('sequelize');
const { Event, NewsArticle } = require('../models');

const listPublishedEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at'],
      where: { status: 'PUBLISHED' },
      order: [['starts_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: { events } });
  } catch (error) { return next(error); }
};

const listPublishedNews = async (req, res, next) => {
  try {
    const articles = await NewsArticle.findAll({
      attributes: ['id', 'title', 'excerpt', 'category', 'author', 'image_url', 'published_at'],
      where: { status: 'PUBLISHED', published_at: { [Op.lte]: new Date() } },
      order: [['published_at', 'DESC'], ['id', 'DESC']],
      limit: 100,
    });
    return res.json({ success: true, data: { articles } });
  } catch (error) { return next(error); }
};

module.exports = { listPublishedEvents, listPublishedNews };

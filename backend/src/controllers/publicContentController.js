'use strict';

const path = require('node:path');
const { Op } = require('sequelize');
const { Event, NewsArticle } = require('../models');

const NEWS_IMAGE_STORAGE_DIR = path.resolve(process.env.NEWS_IMAGE_STORAGE_PATH || path.join(__dirname, '../../private/news-images'));

const getNewsImage = (req, res, next) => {
  const key = String(req.params.key || '');
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(key)) return res.status(404).json({ success: false, message: 'Image not found.' });
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(path.join(NEWS_IMAGE_STORAGE_DIR, key), (error) => {
    if (error && !res.headersSent) {
      if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'Image not found.' });
      return next(error);
    }
  });
};

const listPublishedEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'is_free', 'member_price', [Event.sequelize.literal('(SELECT COUNT(*) FROM event_registrations AS registrations WHERE registrations.event_id = Event.id)'), 'registration_count']],
      where: { status: 'PUBLISHED' },
      order: [['starts_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: { events } });
  } catch (error) { return next(error); }
};

const getPublishedEvent = async (req, res, next) => {
  try {
    const id = String(req.params.id || '');
    if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const event = await Event.findOne({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'is_free', 'member_price', [Event.sequelize.literal('(SELECT COUNT(*) FROM event_registrations AS registrations WHERE registrations.event_id = Event.id)'), 'registration_count']],
      where: { id, status: 'PUBLISHED' },
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    return res.json({ success: true, data: { event } });
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

const getPublishedNewsArticle = async (req, res, next) => {
  try {
    const id = String(req.params.id || '');
    if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
      return res.status(404).json({ success: false, message: 'News article not found.' });
    }
    const article = await NewsArticle.findOne({
      attributes: ['id', 'title', 'excerpt', 'content', 'category', 'author', 'image_url', 'published_at'],
      where: { id, status: 'PUBLISHED', published_at: { [Op.lte]: new Date() } },
    });
    if (!article) return res.status(404).json({ success: false, message: 'News article not found.' });
    return res.json({ success: true, data: { article } });
  } catch (error) { return next(error); }
};

module.exports = { listPublishedEvents, getPublishedEvent, listPublishedNews, getPublishedNewsArticle, getNewsImage };

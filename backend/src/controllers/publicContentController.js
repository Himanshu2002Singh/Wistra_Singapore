'use strict';

const { Op } = require('sequelize');
const { Event, NewsArticle } = require('../models');

const listPublishedEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at', 'is_free', 'member_price', 'non_member_price'],
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
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at', 'is_free', 'member_price', 'non_member_price'],
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

module.exports = { listPublishedEvents, getPublishedEvent, listPublishedNews, getPublishedNewsArticle };

'use strict';

const { Event, NewsArticle, AuditLog } = require('../models');

const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const validDate = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && !Number.isNaN(Date.parse(value));

const listAdminEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at', 'status', 'created_at'],
      order: [['starts_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: events });
  } catch (error) { return next(error); }
};

const createAdminEvent = async (req, res, next) => {
  const { title, description, event_type, location, starts_at, ends_at, status = 'DRAFT' } = req.body || {};
  if (!text(title, 180) || !text(description, 10000) || !text(event_type, 80) || !text(location, 255)
    || !validDate(starts_at) || (ends_at && !validDate(ends_at))
    || !['DRAFT', 'PUBLISHED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Provide a title, description, event type, location, valid start date, optional valid end date, and DRAFT or PUBLISHED status.' });
  }
  if (ends_at && new Date(ends_at) < new Date(starts_at)) {
    return res.status(400).json({ success: false, message: 'The event end date must be on or after its start date.' });
  }
  const transaction = await Event.sequelize.transaction();
  try {
    const event = await Event.create({
      title: title.trim(), description: description.trim(), event_type: event_type.trim(), location: location.trim(),
      starts_at: new Date(starts_at), ends_at: ends_at ? new Date(ends_at) : null, status, created_by: req.user.id,
    }, { transaction });
    await AuditLog.create({
      user_id: req.user.id, action: 'EVENT_CREATED', module: 'events', entity_type: 'event', entity_id: String(event.id),
      new_values: { title: event.title, status: event.status, starts_at: event.starts_at }, ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    }, { transaction });
    await transaction.commit();
    return res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const listAdminNews = async (req, res, next) => {
  try {
    const articles = await NewsArticle.findAll({
      attributes: ['id', 'title', 'excerpt', 'content', 'category', 'author', 'image_url', 'status', 'published_at', 'created_at'],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: articles });
  } catch (error) { return next(error); }
};

const createAdminNews = async (req, res, next) => {
  const { title, excerpt, content, category, author, image_url, status = 'DRAFT' } = req.body || {};
  const validImage = image_url === undefined || image_url === ''
    || (typeof image_url === 'string' && image_url.length <= 2048 && /^https?:\/\//i.test(image_url));
  if (!text(title, 180) || !text(excerpt, 500) || !text(content, 30000) || !text(category, 80)
    || !text(author, 150) || !validImage || !['DRAFT', 'PUBLISHED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Provide a title, excerpt, article content, category, author, optional HTTP(S) image URL, and DRAFT or PUBLISHED status.' });
  }
  const transaction = await NewsArticle.sequelize.transaction();
  try {
    const article = await NewsArticle.create({
      title: title.trim(), excerpt: excerpt.trim(), content: content.trim(), category: category.trim(), author: author.trim(),
      image_url: image_url || null, status, published_at: status === 'PUBLISHED' ? new Date() : null, created_by: req.user.id,
    }, { transaction });
    await AuditLog.create({
      user_id: req.user.id, action: 'NEWS_ARTICLE_CREATED', module: 'news', entity_type: 'news_article', entity_id: String(article.id),
      new_values: { title: article.title, status: article.status }, ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    }, { transaction });
    await transaction.commit();
    return res.status(201).json({ success: true, message: 'News article created.', data: article });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

module.exports = { listAdminEvents, createAdminEvent, listAdminNews, createAdminNews };

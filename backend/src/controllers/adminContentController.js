'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Event, NewsArticle, AuditLog } = require('../models');

const NEWS_IMAGE_STORAGE_DIR = path.resolve(process.env.NEWS_IMAGE_STORAGE_PATH || path.join(__dirname, '../../private/news-images'));

const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const sanitizeText = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const hasMarkup = (value) => /<\/?[a-z][^>]*>/i.test(value);
const validImageReference = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (/^\/content\/news\/images\/[0-9a-f-]+\.(?:jpg|png|webp)$/i.test(value)) return true;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};
const parseArticleId = (value) => /^\d+$/.test(String(value || '')) && BigInt(value) > 0n ? String(value) : null;
const newsAudit = (req, action, article, values = {}, options = {}) => AuditLog.create({
  user_id: req.user.id,
  action,
  module: 'news',
  entity_type: 'news_article',
  entity_id: String(article.id),
  ...values,
  ip_address: req.ip,
  user_agent: String(req.get('user-agent') || '').slice(0, 500),
}, options);

const NEWS_FIELDS = ['title', 'excerpt', 'content', 'category', 'author'];
const NEWS_LIMITS = { title: 180, excerpt: 500, content: 30000, category: 80, author: 150 };
const validateNewsFields = (values, { allowPartial = false } = {}) => {
  const errors = {};
  const normalized = {};
  for (const field of NEWS_FIELDS) {
    if (allowPartial && !Object.prototype.hasOwnProperty.call(values, field)) continue;
    if (!text(values[field], NEWS_LIMITS[field])) {
      errors[field] = `${field} is required and must be at most ${NEWS_LIMITS[field]} characters.`;
      continue;
    }
    const cleanValue = sanitizeText(values[field]);
    if (!cleanValue || cleanValue.length > NEWS_LIMITS[field]) {
      errors[field] = `${field} is required and must be at most ${NEWS_LIMITS[field]} characters.`;
      continue;
    }
    if (field === 'content' && hasMarkup(cleanValue)) {
      errors[field] = 'Article content must be plain text; HTML markup is not supported by the current editor.';
      continue;
    }
    normalized[field] = cleanValue;
  }
  if (Object.prototype.hasOwnProperty.call(values, 'image_url')) {
    if (!validImageReference(values.image_url)) errors.image_url = 'image_url must be an HTTP or HTTPS image reference of at most 2048 characters.';
    else normalized.image_url = typeof values.image_url === 'string' ? sanitizeText(values.image_url) || null : null;
  } else if (!allowPartial) {
    normalized.image_url = null;
  }
  return { errors, normalized };
};
const validDate = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && !Number.isNaN(Date.parse(value));

const listAdminEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at', 'status', 'is_free', 'member_price', 'non_member_price', 'created_at'],
      order: [['starts_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: events });
  } catch (error) { return next(error); }
};

const createAdminEvent = async (req, res, next) => {
  const { title, description, event_type, location, starts_at, ends_at, status = 'DRAFT', is_free = true, member_price, non_member_price } = req.body || {};
  if (!text(title, 180) || !text(description, 10000) || !text(event_type, 80) || !text(location, 255)
    || !validDate(starts_at) || (ends_at && !validDate(ends_at))
    || !['DRAFT', 'PUBLISHED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Provide a title, description, event type, location, valid start date, optional valid end date, and DRAFT or PUBLISHED status.' });
  }
  if (ends_at && new Date(ends_at) < new Date(starts_at)) {
    return res.status(400).json({ success: false, message: 'The event end date must be on or after its start date.' });
  }
  const validPrice = (value) => value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
  if (typeof is_free !== 'boolean' || (!is_free && (!validPrice(member_price) || !validPrice(non_member_price)))) {
    return res.status(400).json({ success: false, message: 'Paid events require positive member and non-member prices. No event price is assumed.' });
  }
  const transaction = await Event.sequelize.transaction();
  try {
    const event = await Event.create({
      title: title.trim(), description: description.trim(), event_type: event_type.trim(), location: location.trim(),
      starts_at: new Date(starts_at), ends_at: ends_at ? new Date(ends_at) : null, status, created_by: req.user.id,
      is_free, member_price: is_free ? null : Number(member_price), non_member_price: is_free ? null : Number(non_member_price),
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

const uploadAdminNewsImage = async (req, res, next) => {
  try {
    if (!req.newsImage?.buffer) return res.status(400).json({ success: false, message: 'Choose an image file to upload.' });
    const { buffer, claimedType } = req.newsImage;
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    const imageType = isPng ? { mime: 'image/png', extension: 'png' }
      : isJpeg ? { mime: 'image/jpeg', extension: 'jpg' }
        : isWebp ? { mime: 'image/webp', extension: 'webp' } : null;
    if (!imageType || (claimedType && claimedType !== imageType.mime)) {
      return res.status(400).json({ success: false, message: 'Use a valid JPEG, PNG, or WebP image.' });
    }
    if (process.env.NODE_ENV === 'production' && !process.env.NEWS_IMAGE_STORAGE_PATH) {
      return res.status(503).json({ success: false, message: 'News image storage is not configured. Set NEWS_IMAGE_STORAGE_PATH to a persistent directory.' });
    }
    await fs.mkdir(NEWS_IMAGE_STORAGE_DIR, { recursive: true });
    const storageKey = `${randomUUID()}.${imageType.extension}`;
    await fs.writeFile(path.join(NEWS_IMAGE_STORAGE_DIR, storageKey), buffer, { flag: 'wx', mode: 0o644 });
    return res.status(201).json({ success: true, data: { image_url: `/content/news/images/${storageKey}` } });
  } catch (error) { return next(error); }
};

const createAdminNews = async (req, res, next) => {
  const body = req.body || {};
  const allowed = new Set([...NEWS_FIELDS, 'image_url', 'status']);
  if (Object.keys(body).some((field) => !allowed.has(field))) return res.status(400).json({ success: false, message: 'The news article contains unsupported fields.' });
  const { status = 'DRAFT' } = body;
  const { errors, normalized } = validateNewsFields(body);
  if (Object.keys(errors).length || !['DRAFT', 'PUBLISHED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please correct the news article fields.', errors: { ...errors, ...(!['DRAFT', 'PUBLISHED'].includes(status) ? { status: 'status must be DRAFT or PUBLISHED.' } : {}) } });
  }
  if (status === 'PUBLISHED' && req.user.role?.name !== 'SUPER_ADMIN'
    && !['news.publish', 'news.manage'].some((permission) => req.user.permissions?.includes(permission))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to publish news articles.' });
  }
  const transaction = await NewsArticle.sequelize.transaction();
  try {
    const article = await NewsArticle.create({
      ...normalized, status, published_at: status === 'PUBLISHED' ? new Date() : null, created_by: req.user.id,
    }, { transaction });
    await newsAudit(req, 'NEWS_ARTICLE_CREATED', article, { new_values: { title: article.title, status: article.status } }, { transaction });
    await transaction.commit();
    return res.status(201).json({ success: true, message: 'News article created.', data: article });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const updateAdminNews = async (req, res, next) => {
  const id = parseArticleId(req.params.id);
  if (!id) return res.status(404).json({ success: false, message: 'News article not found.' });
  const body = req.body || {};
  const allowed = new Set([...NEWS_FIELDS, 'image_url']);
  if (Object.keys(body).some((field) => !allowed.has(field))) return res.status(400).json({ success: false, message: 'Only article content fields can be updated here.' });
  const { errors, normalized } = validateNewsFields(body, { allowPartial: true });
  if (Object.keys(errors).length || !Object.keys(normalized).length) {
    return res.status(400).json({ success: false, message: 'Provide valid article fields to update.', errors });
  }

  const transaction = await NewsArticle.sequelize.transaction();
  try {
    const article = await NewsArticle.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'News article not found.' });
    }
    const oldStatus = article.status;
    const oldTitle = article.title;
    await article.update(normalized, { transaction });
    await newsAudit(req, 'NEWS_ARTICLE_UPDATED', article, {
      old_values: { title: oldTitle, status: oldStatus, changed_fields: Object.keys(normalized) },
      new_values: { title: article.title, status: article.status, changed_fields: Object.keys(normalized) },
    }, { transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'News article updated.', data: article });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

const setAdminNewsPublication = async (req, res, next) => {
  const id = parseArticleId(req.params.id);
  if (!id) return res.status(404).json({ success: false, message: 'News article not found.' });
  const body = req.body || {};
  if (Object.keys(body).some((field) => field !== 'status') || !['DRAFT', 'PUBLISHED'].includes(body.status)) {
    return res.status(400).json({ success: false, message: 'status must be DRAFT or PUBLISHED.' });
  }

  const transaction = await NewsArticle.sequelize.transaction();
  try {
    const article = await NewsArticle.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'News article not found.' });
    }
    const needsPublicationTimestamp = body.status === 'PUBLISHED'
      && (!article.published_at || new Date(article.published_at) > new Date());
    if (article.status !== body.status || needsPublicationTimestamp) {
      const oldStatus = article.status;
      await article.update({
        status: body.status,
        published_at: body.status === 'PUBLISHED' ? new Date() : null,
      }, { transaction });
      await newsAudit(req, body.status === 'PUBLISHED' ? 'NEWS_ARTICLE_PUBLISHED' : 'NEWS_ARTICLE_UNPUBLISHED', article, {
        old_values: { status: oldStatus }, new_values: { status: article.status, published_at: article.published_at },
      }, { transaction });
    }
    await transaction.commit();
    return res.json({ success: true, message: body.status === 'PUBLISHED' ? 'News article published.' : 'News article unpublished.', data: article });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

const deleteAdminNews = async (req, res, next) => {
  const id = parseArticleId(req.params.id);
  if (!id) return res.status(404).json({ success: false, message: 'News article not found.' });

  const transaction = await NewsArticle.sequelize.transaction();
  try {
    const article = await NewsArticle.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'News article not found.' });
    }
    const auditData = { id: article.id, title: article.title };
    await newsAudit(req, 'NEWS_ARTICLE_DELETED', article, { old_values: { title: article.title, status: article.status } }, { transaction });
    await article.destroy({ transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'News article deleted.', data: auditData });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

module.exports = {
  listAdminEvents,
  createAdminEvent,
  listAdminNews,
  uploadAdminNewsImage,
  createAdminNews,
  updateAdminNews,
  setAdminNewsPublication,
  deleteAdminNews,
};

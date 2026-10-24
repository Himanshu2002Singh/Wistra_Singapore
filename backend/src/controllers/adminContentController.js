'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Event, EventRegistration, NewsArticle, AuditLog } = require('../models');

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
      attributes: ['id', 'title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'status', 'is_free', 'member_price', 'created_at', [Event.sequelize.literal('(SELECT COUNT(*) FROM event_registrations AS registrations WHERE registrations.event_id = Event.id)'), 'registration_count']],
      order: [['starts_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
    });
    return res.json({ success: true, data: events });
  } catch (error) { return next(error); }
};

const eventFieldErrors = (values, { partial = false } = {}) => {
  const errors = {};
  const fields = ['title', 'description', 'event_type', 'location'];
  for (const field of fields) {
    if (partial && !Object.hasOwn(values, field)) continue;
    const limit = field === 'description' ? 10000 : field === 'title' ? 180 : field === 'event_type' ? 80 : 255;
    if (!text(values[field], limit)) errors[field] = `${field} is required (maximum ${limit} characters).`;
  }
  for (const field of ['starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at']) {
    if (partial && !Object.hasOwn(values, field)) continue;
    if (values[field] !== undefined && values[field] !== null && values[field] !== '' && !validDate(values[field])) errors[field] = `${field} must be a valid ISO date and time.`;
  }
  if ((!partial || Object.hasOwn(values, 'starts_at')) && !values.starts_at) errors.starts_at = 'starts_at is required.';
  if ((!partial || Object.hasOwn(values, 'ends_at')) && values.ends_at && values.starts_at && new Date(values.ends_at) < new Date(values.starts_at)) errors.ends_at = 'Event end must be on or after its start.';
  if ((!partial || Object.hasOwn(values, 'registration_opens_at')) && values.registration_opens_at && values.starts_at && new Date(values.registration_opens_at) >= new Date(values.starts_at)) errors.registration_opens_at = 'Registration must open before the event starts.';
  if ((!partial || Object.hasOwn(values, 'registration_closes_at')) && values.registration_closes_at && values.starts_at && new Date(values.registration_closes_at) > new Date(values.starts_at)) errors.registration_closes_at = 'Registration must close no later than the event start.';
  if (Object.hasOwn(values, 'capacity') && values.capacity !== null && values.capacity !== '' && (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) < 1 || Number(values.capacity) > 1000000)) errors.capacity = 'Capacity must be a positive whole number or blank for unlimited.';
  if (Object.hasOwn(values, 'format') && !['IN_PERSON', 'ONLINE', 'HYBRID'].includes(values.format)) errors.format = 'Choose in-person, online, or hybrid.';
  if (Object.hasOwn(values, 'image_url') && !validImageReference(values.image_url)) errors.image_url = 'Image must be an HTTP or HTTPS URL.';
  if (Object.hasOwn(values, 'status') && !['DRAFT', 'PUBLISHED', 'CANCELLED'].includes(values.status)) errors.status = 'Choose draft, published, or cancelled.';
  if (Object.hasOwn(values, 'is_free') && typeof values.is_free !== 'boolean') errors.is_free = 'is_free must be true or false.';
  if (Object.hasOwn(values, 'member_price') && values.member_price !== '' && values.member_price !== null && (!Number.isFinite(Number(values.member_price)) || Number(values.member_price) <= 0)) errors.member_price = 'Member price must be greater than zero.';
  return errors;
};

const createAdminEvent = async (req, res, next) => {
  const allowed = new Set(['title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'status', 'is_free', 'member_price']);
  if (Object.keys(req.body || {}).some((field) => !allowed.has(field))) return res.status(400).json({ success: false, message: 'The event contains unsupported fields.' });
  const values = { status: 'DRAFT', is_free: true, format: 'IN_PERSON', currency: 'SGD', ...req.body };
  const errors = eventFieldErrors(values);
  if (!values.is_free && (!Number.isFinite(Number(values.member_price)) || Number(values.member_price) <= 0)) errors.member_price = 'Paid events require a positive member price.';
  if (!['SGD'].includes(values.currency)) errors.currency = 'Only SGD is configured for event payments.';
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Please correct the event fields.', errors });
  if (values.status === 'PUBLISHED' && !canPublishEvents(req.user)) return res.status(403).json({ success: false, message: 'You do not have permission to publish events.' });
  const transaction = await Event.sequelize.transaction();
  try {
    const event = await Event.create({ ...normalizeEventValues(values), created_by: req.user.id }, { transaction });
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

const updateAdminEvent = async (req, res, next) => {
  const id = parseArticleId(req.params.eventId);
  if (!id) return res.status(404).json({ success: false, message: 'Event not found.' });
  const allowed = new Set(['title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'status', 'is_free', 'member_price']);
  const body = req.body || {};
  if (!Object.keys(body).length || Object.keys(body).some((field) => !allowed.has(field))) return res.status(400).json({ success: false, message: 'Provide supported event fields to update.' });
  const errors = eventFieldErrors(body, { partial: true });
  if (body.is_free === false && body.member_price === undefined) errors.member_price = 'A paid event must have a member price.';
  if (body.currency && body.currency !== 'SGD') errors.currency = 'Only SGD is configured for event payments.';
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Please correct the event fields.', errors });
  if (body.status === 'PUBLISHED' && !canPublishEvents(req.user)) return res.status(403).json({ success: false, message: 'You do not have permission to publish events.' });
  let transaction;
  try {
    transaction = await Event.sequelize.transaction();
    const event = await Event.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) { await transaction.rollback(); return res.status(404).json({ success: false, message: 'Event not found.' }); }
    const mergedErrors = eventFieldErrors({
      title: body.title ?? event.title, description: body.description ?? event.description,
      event_type: body.event_type ?? event.event_type, location: body.location ?? event.location,
      starts_at: body.starts_at ?? new Date(event.starts_at).toISOString(),
      ends_at: Object.hasOwn(body, 'ends_at') ? body.ends_at : (event.ends_at ? new Date(event.ends_at).toISOString() : null),
      registration_opens_at: Object.hasOwn(body, 'registration_opens_at') ? body.registration_opens_at : (event.registration_opens_at ? new Date(event.registration_opens_at).toISOString() : null),
      registration_closes_at: Object.hasOwn(body, 'registration_closes_at') ? body.registration_closes_at : (event.registration_closes_at ? new Date(event.registration_closes_at).toISOString() : null),
    });
    if (Object.keys(mergedErrors).length) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'The updated event dates are inconsistent.', errors: mergedErrors }); }
    const normalized = normalizeEventValues(body, { partial: true });
    const nextCapacity = Object.hasOwn(normalized, 'capacity') ? normalized.capacity : event.capacity;
    if (nextCapacity !== null) {
      const count = await EventRegistration.count({ where: { event_id: id }, transaction });
      if (Number(nextCapacity) < count) { await transaction.rollback(); return res.status(409).json({ success: false, message: `Capacity cannot be lower than the ${count} existing registrations.` }); }
    }
    const oldValues = Object.fromEntries(Object.keys(normalized).map((key) => [key, event[key]]));
    await event.update(normalized, { transaction });
    await AuditLog.create({ user_id: req.user.id, action: 'EVENT_UPDATED', module: 'events', entity_type: 'event', entity_id: String(event.id), old_values: oldValues, new_values: normalized, ip_address: req.ip, user_agent: String(req.get('user-agent') || '').slice(0, 500) }, { transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'Event updated.', data: event });
  } catch (error) { if (transaction && !transaction.finished) await transaction.rollback(); return next(error); }
};

function normalizeEventValues(values, { partial = false } = {}) {
  const result = {};
  for (const field of ['title', 'description', 'event_type', 'location']) if (Object.hasOwn(values, field)) result[field] = values[field].trim();
  for (const field of ['image_url', 'format', 'currency', 'status', 'is_free']) if (Object.hasOwn(values, field)) result[field] = values[field] === '' && field === 'image_url' ? null : values[field];
  for (const field of ['starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at']) if (Object.hasOwn(values, field)) result[field] = values[field] ? new Date(values[field]) : null;
  if (Object.hasOwn(values, 'capacity')) result.capacity = values.capacity === '' || values.capacity === null ? null : Number(values.capacity);
  if (Object.hasOwn(values, 'member_price')) result.member_price = values.member_price === '' || values.member_price === null ? null : Number(values.member_price);
  if (Object.hasOwn(values, 'is_free') && values.is_free) result.member_price = null;
  if (!partial) { result.currency = values.currency || 'SGD'; result.format = values.format || 'IN_PERSON'; result.status = values.status || 'DRAFT'; result.is_free = values.is_free !== false; }
  return result;
}

function canPublishEvents(user) {
  return user?.role?.name === 'SUPER_ADMIN' || user?.permissions?.some((permission) => ['events.publish', 'events.manage'].includes(permission));
}

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
      return res.status(503).json({ success: false, message: 'Content image storage is not configured. Set NEWS_IMAGE_STORAGE_PATH to a persistent directory.' });
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
  updateAdminEvent,
  listAdminNews,
  uploadAdminNewsImage,
  createAdminNews,
  updateAdminNews,
  setAdminNewsPublication,
  deleteAdminNews,
};

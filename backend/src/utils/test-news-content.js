'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { sequelize, User, Role, NewsArticle, AuditLog } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

const createdUserIds = [];
const createdArticleIds = [];
let server;

const actor = async (role, email) => {
  const roleRow = await Role.findOne({ where: { name: role } });
  assert.ok(roleRow, `Requires the existing ${role} role`);
  const user = await User.create({
    first_name: 'News', last_name: 'Audit Test', email,
    password_hash: await hashPassword(`News-Test-${Date.now()}-${Math.random()}!`),
    role_id: roleRow.id, status: 'ACTIVE',
  });
  createdUserIds.push(user.id);
  return { user, token: generateToken({ sub: user.id, role }) };
};

const request = async (baseUrl, endpoint, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

const run = async () => {
  await sequelize.authenticate();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  let cleanupVerified = false;

  try {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = await actor('COMMUNICATIONS_ADMIN', `news-admin-${unique}@example.invalid`);
    const member = await actor('MEMBER', `news-member-${unique}@example.invalid`);
    const eventsAdmin = await actor('EVENTS_ADMIN', `news-events-admin-${unique}@example.invalid`);
    const superAdmin = await actor('SUPER_ADMIN', `news-super-admin-${unique}@example.invalid`);
    const content = (title) => ({
      title, excerpt: `${title} excerpt`, content: `${title} first paragraph.\n\n${title} second paragraph.`,
      category: 'Insights', author: 'WISTA Singapore', image_url: null,
    });

    assert.equal((await request(baseUrl, '/admin/content/news')).status, 401, 'Admin news list requires authentication');
    assert.equal((await request(baseUrl, '/admin/content/news', { token: 'not.a.valid.jwt' })).status, 401, 'Rejects an invalid access token');
    const expiredToken = jwt.sign({ sub: admin.user.id }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request(baseUrl, '/admin/content/news', { token: expiredToken })).status, 401, 'Rejects an expired access token');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const limitedAttempt = await request(baseUrl, '/auth/login', { method: 'POST', body: { email: `missing-${unique}@example.invalid`, password: 'incorrect-password' } });
      assert.notEqual(limitedAttempt.status, 429, 'Login requests below the configured threshold remain available');
    }
    assert.equal((await request(baseUrl, '/auth/login', { method: 'POST', body: { email: `missing-${unique}@example.invalid`, password: 'incorrect-password' } })).status, 429, 'Applies per-IP throttling to repeated login attempts');
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const limitedRegistration = await request(baseUrl, '/auth/register', { method: 'POST', body: {} });
      assert.equal(limitedRegistration.status, 400, 'Registration validation remains available below its threshold');
    }
    assert.equal((await request(baseUrl, '/auth/register', { method: 'POST', body: {} })).status, 429, 'Applies per-IP throttling to repeated registration attempts');
    assert.equal((await request(baseUrl, '/admin/content/news', { token: member.token })).status, 403, 'Members cannot read the Admin content list');
    assert.equal((await request(baseUrl, '/admin/content/news', { token: eventsAdmin.token })).status, 403, 'Unrelated admin roles cannot read news');
    assert.equal((await request(baseUrl, '/admin/content/news', { method: 'POST', token: member.token, body: content('Forbidden') })).status, 403, 'Members cannot create articles');

    const draftResponse = await request(baseUrl, '/admin/content/news', { method: 'POST', token: admin.token, body: content(`Draft ${unique}`) });
    assert.equal(draftResponse.status, 201, 'Communications admin can create a draft');
    const draft = draftResponse.body.data;
    createdArticleIds.push(draft.id);
    assert.equal(draft.status, 'DRAFT');

    const draftList = await request(baseUrl, '/content/news');
    assert.equal(draftList.status, 200);
    assert.ok(!draftList.body.data.articles.some(({ id }) => String(id) === String(draft.id)), 'Public listing excludes drafts');
    assert.equal((await request(baseUrl, `/content/news/${draft.id}`)).status, 404, 'Direct public request does not reveal draft details');
    assert.equal((await request(baseUrl, '/content/news/not-a-number')).status, 404, 'Invalid public article identifiers return not found');

    const badMarkup = await request(baseUrl, '/admin/content/news', { method: 'POST', token: admin.token, body: { ...content('Markup'), content: '<script>alert(1)</script>' } });
    assert.equal(badMarkup.status, 400, 'Rejects HTML in the existing plain-text editor workflow');
    const badImage = await request(baseUrl, '/admin/content/news', { method: 'POST', token: admin.token, body: { ...content('Bad image'), image_url: 'javascript:alert(1)' } });
    assert.equal(badImage.status, 400, 'Rejects unsafe image URL schemes');
    const missingField = await request(baseUrl, '/admin/content/news', { method: 'POST', token: admin.token, body: { ...content('Missing'), title: ' ' } });
    assert.equal(missingField.status, 400, 'Validates required article fields');

    const updateResponse = await request(baseUrl, `/admin/content/news/${draft.id}`, {
      method: 'PATCH', token: admin.token, body: { title: `Edited ${unique}`, content: 'Edited plain-text story.' },
    });
    assert.equal(updateResponse.status, 200, 'Communications admin can edit article content');
    assert.equal(updateResponse.body.data.title, `Edited ${unique}`);
    assert.equal((await request(baseUrl, `/admin/content/news/${draft.id}`, { method: 'PATCH', token: eventsAdmin.token, body: { title: 'Denied' } })).status, 403, 'Edit permission is enforced server-side');
    assert.equal((await request(baseUrl, `/admin/content/news/999999999`, { method: 'PATCH', token: admin.token, body: { title: 'Missing' } })).status, 404, 'Editing a missing article returns not found');

    const publishResponse = await request(baseUrl, `/admin/content/news/${draft.id}/publication`, { method: 'PATCH', token: admin.token, body: { status: 'PUBLISHED' } });
    assert.equal(publishResponse.status, 200, 'Communications admin can publish');
    assert.equal(publishResponse.body.data.status, 'PUBLISHED');
    assert.ok(publishResponse.body.data.published_at, 'Publication records a publication timestamp');
    const publicList = await request(baseUrl, '/content/news');
    assert.ok(publicList.body.data.articles.some(({ id }) => String(id) === String(draft.id)), 'Published Admin article appears in public listing');
    const detail = await request(baseUrl, `/content/news/${draft.id}`);
    assert.equal(detail.status, 200, 'Public detail endpoint returns published article');
    assert.equal(detail.body.data.article.content, 'Edited plain-text story.');
    assert.equal(detail.body.data.article.password_hash, undefined, 'Public response only returns article fields');

    const unpublishResponse = await request(baseUrl, `/admin/content/news/${draft.id}/publication`, { method: 'PATCH', token: admin.token, body: { status: 'DRAFT' } });
    assert.equal(unpublishResponse.status, 200, 'Communications admin can unpublish');
    assert.equal(unpublishResponse.body.data.published_at, null, 'Unpublishing removes the public timestamp');
    assert.equal((await request(baseUrl, `/content/news/${draft.id}`)).status, 404, 'Unpublished direct detail is hidden');
    assert.ok(!(await request(baseUrl, '/content/news')).body.data.articles.some(({ id }) => String(id) === String(draft.id)), 'Unpublished article is removed from public listing');

    assert.equal((await request(baseUrl, `/admin/content/news/${draft.id}/publication`, { method: 'PATCH', token: eventsAdmin.token, body: { status: 'PUBLISHED' } })).status, 403, 'Publish permission is enforced server-side');
    assert.equal((await request(baseUrl, `/admin/content/news/${draft.id}/publication`, { method: 'PATCH', token: admin.token, body: { status: 'SCHEDULED' } })).status, 400, 'Unsupported publication statuses are rejected');
    assert.equal((await request(baseUrl, '/admin/content/news/999999999/publication', { method: 'PATCH', token: admin.token, body: { status: 'PUBLISHED' } })).status, 404, 'Publishing a missing article returns not found');

    const adminList = await request(baseUrl, '/admin/content/news', { token: admin.token });
    assert.ok(adminList.body.data.some(({ id }) => String(id) === String(draft.id)), 'Admin list contains saved articles');
    const auditActions = (await AuditLog.findAll({ where: { module: 'news', entity_type: 'news_article', entity_id: String(draft.id) } })).map(({ action }) => action);
    for (const action of ['NEWS_ARTICLE_CREATED', 'NEWS_ARTICLE_UPDATED', 'NEWS_ARTICLE_PUBLISHED', 'NEWS_ARTICLE_UNPUBLISHED']) {
      assert.ok(auditActions.includes(action), `Audit log records ${action}`);
    }
    const creationAudit = await AuditLog.findOne({ where: { module: 'news', entity_type: 'news_article', entity_id: String(draft.id), action: 'NEWS_ARTICLE_CREATED' } });
    assert.equal((await request(baseUrl, '/admin/audit-logs', { token: member.token })).status, 403, 'Members cannot read audit logs');
    assert.equal((await request(baseUrl, `/admin/audit-logs/${creationAudit.id}`, { token: admin.token })).status, 403, 'Content administrators without audit permission cannot read audit logs');
    const authorizedAudit = await request(baseUrl, `/admin/audit-logs/${creationAudit.id}`, { token: superAdmin.token });
    assert.equal(authorizedAudit.status, 200, 'Authorized super administrator can read audit records');
    assert.equal(String(authorizedAudit.body.data.user_id), String(admin.user.id), 'Audit record identifies the actor');
    assert.equal((await request(baseUrl, `/admin/audit-logs/${creationAudit.id}`, { method: 'DELETE', token: superAdmin.token })).status, 404, 'Audit records have no mutation endpoint');

    const deleteResponse = await request(baseUrl, `/admin/content/news/${draft.id}`, { method: 'DELETE', token: admin.token });
    assert.equal(deleteResponse.status, 200, 'Communications admin can delete an article');
    assert.equal((await request(baseUrl, `/content/news/${draft.id}`)).status, 404, 'Deleted article is not publicly accessible');
    assert.ok((await AuditLog.findAll({ where: { module: 'news', entity_type: 'news_article', entity_id: String(draft.id) } })).some(({ action }) => action === 'NEWS_ARTICLE_DELETED'), 'Deletion writes an audit entry');
    assert.equal((await request(baseUrl, '/admin/content/news/999999999', { method: 'DELETE', token: admin.token })).status, 404, 'Deleting a missing article returns not found');

    console.log('News content integration checks passed: RBAC, validation, draft/public visibility, detail, editing, publish/unpublish, deletion, and audit logging.');
  } finally {
    if (createdArticleIds.length) {
      await AuditLog.destroy({ where: { module: 'news', entity_type: 'news_article', entity_id: createdArticleIds.map(String) } });
      await NewsArticle.destroy({ where: { id: createdArticleIds } });
    }
    if (createdUserIds.length) {
      await AuditLog.destroy({ where: { user_id: createdUserIds } });
      await User.destroy({ where: { id: createdUserIds } });
    }
    const [remainingArticles, remainingArticleAudits, remainingUsers] = await Promise.all([
      createdArticleIds.length ? NewsArticle.count({ where: { id: createdArticleIds } }) : 0,
      createdArticleIds.length ? AuditLog.count({ where: { module: 'news', entity_type: 'news_article', entity_id: createdArticleIds.map(String) } }) : 0,
      createdUserIds.length ? User.count({ where: { id: createdUserIds } }) : 0,
    ]);
    cleanupVerified = remainingArticles === 0 && remainingArticleAudits === 0 && remainingUsers === 0;
    assert.equal(cleanupVerified, true, 'Cleans only test-created records and verifies cleanup');
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await sequelize.close();
  }
  console.log(`Test cleanup verified: ${cleanupVerified}; ${createdArticleIds.length} articles, their audit rows, and ${createdUserIds.length} test users removed.`);
};

run().catch((error) => {
  console.error('News content integration tests failed:', error);
  process.exitCode = 1;
});

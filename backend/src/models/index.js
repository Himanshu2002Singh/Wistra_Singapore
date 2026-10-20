'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const IndividualProfile = require('./IndividualProfile');
const CorporateProfile = require('./CorporateProfile');
const CorporateRepresentative = require('./CorporateRepresentative');
const MembershipApplication = require('./MembershipApplication');
const Membership = require('./Membership');
const MembershipStatusHistory = require('./MembershipStatusHistory');
const DirectoryPrivacySettings = require('./DirectoryPrivacySettings');
const AuditLog = require('./AuditLog');
const Payment = require('./Payment');
const PaymentSubmission = require('./PaymentSubmission');
const Invoice = require('./Invoice');
const Event = require('./Event');
const NewsArticle = require('./NewsArticle');
const StudentProfile = require('./StudentProfile');
const EventRegistration = require('./EventRegistration');
const ContactMessage = require('./ContactMessage');
const PasswordResetToken = require('./PasswordResetToken');

// Initialize all models
User.init(sequelize);
Role.init(sequelize);
Permission.init(sequelize);
IndividualProfile.init(sequelize);
CorporateProfile.init(sequelize);
CorporateRepresentative.init(sequelize);
MembershipApplication.init(sequelize);
Membership.init(sequelize);
MembershipStatusHistory.init(sequelize);
DirectoryPrivacySettings.init(sequelize);
AuditLog.init(sequelize);
Payment.init(sequelize);
PaymentSubmission.init(sequelize);
Invoice.init(sequelize);
Event.init(sequelize);
NewsArticle.init(sequelize);
StudentProfile.init(sequelize);
EventRegistration.init(sequelize);
ContactMessage.init(sequelize);
PasswordResetToken.init(sequelize);

// Store models in an object for association setup
const models = {
  User,
  Role,
  Permission,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  MembershipApplication,
  Membership,
  MembershipStatusHistory,
  DirectoryPrivacySettings,
  AuditLog,
  Payment,
  PaymentSubmission,
  Invoice,
  Event,
  NewsArticle,
  StudentProfile,
  EventRegistration,
  ContactMessage,
  PasswordResetToken,
};

// Setup associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};

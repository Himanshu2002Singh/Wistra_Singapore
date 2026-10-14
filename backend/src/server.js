require('dotenv').config();

const validateProductionEnvironment = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['CLIENT_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'STUDENT_DOCUMENT_STORAGE_PATH'];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);

  const invalidOrigins = process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter((origin) => {
    try { return new URL(origin).protocol !== 'https:' || new URL(origin).origin !== origin; }
    catch { return true; }
  });
  if (invalidOrigins.length) throw new Error('CLIENT_URL must contain only HTTPS origins, separated by commas.');
  if (!require('node:path').isAbsolute(process.env.STUDENT_DOCUMENT_STORAGE_PATH)) {
    throw new Error('STUDENT_DOCUMENT_STORAGE_PATH must be an absolute private persistent storage path in production.');
  }
  if (process.env.JWT_SECRET.length < 32 || /^(change[-_ ]?me|your[-_ ]|secret$)/i.test(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be a non-placeholder value with at least 32 characters.');
  }
  if (!/^\d+$/.test(process.env.DB_PORT) || Number(process.env.DB_PORT) < 1 || Number(process.env.DB_PORT) > 65535) {
    throw new Error('DB_PORT must be a valid TCP port number.');
  }
};

validateProductionEnvironment();

const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL database connected successfully.");

    app.listen(PORT, () => {
      console.log('WISTA API listening.', { port: PORT, environment: process.env.NODE_ENV || 'development' });
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error('Database startup check failed.', { name: error.name, code: error.original?.code || error.code });

    process.exit(1);
  }
};

startServer();

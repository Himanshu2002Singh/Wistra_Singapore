'use strict';

require('dotenv').config();
const http = require('http');
const app = require('../app');
const sequelize = require('../config/database');
const { User, Role } = require('../models');
const { comparePassword } = require('./password');

let server;
let PORT = 5099;

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('=== STARTING AUTHENTICATION SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);

  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let jwtToken = '';

  try {
    // 1. GET /api/health
    console.log('\n[1] Testing Health Check...');
    const health = await request('/api/health');
    console.log('Health Response:', health.status, health.body);
    if (health.status !== 200 || health.body.database !== 'connected') {
      throw new Error('Health check failed');
    }

    // 2. Register valid user
    console.log('\n[2] Testing Registration...');
    const regRes = await request('/api/auth/register', 'POST', {
      email: testEmail,
      password: testPassword,
      first_name: 'Test',
      last_name: 'Member',
      phone: '+65 91234567',
    });
    console.log('Register Response:', regRes.status, regRes.body);
    if (regRes.status !== 201 || !regRes.body.success) {
      throw new Error('Registration failed');
    }

    // 3. Confirm password_hash is NOT returned in register response
    if (regRes.body.data.user.password_hash) {
      throw new Error('SECURITY VIOLATION: password_hash leaked in register response!');
    }

    // 4. Confirm password is hashed in database
    const dbUser = await User.findOne({ where: { email: testEmail } });
    if (!dbUser || !dbUser.password_hash) {
      throw new Error('User not found in DB');
    }
    const isBcryptHash = dbUser.password_hash.startsWith('$2b$') || dbUser.password_hash.startsWith('$2a$');
    if (!isBcryptHash) {
      throw new Error('Password is not hashed with bcrypt!');
    }
    console.log('DB Password Hash verified (bcrypt):', dbUser.password_hash.substring(0, 15) + '...');

    // 5. Attempt duplicate registration
    console.log('\n[3] Testing Duplicate Registration...');
    const dupRes = await request('/api/auth/register', 'POST', {
      email: testEmail,
      password: testPassword,
      first_name: 'Test',
      last_name: 'Member',
    });
    console.log('Duplicate Register Response:', dupRes.status, dupRes.body);
    if (dupRes.status !== 409) {
      throw new Error('Duplicate registration should return 409 Conflict');
    }

    // 6. Attempt registration with role escalation attempt
    console.log('\n[4] Testing Role Escalation Prevention...');
    const escalateEmail = `admin.hack.${Date.now()}@example.com`;
    const escRes = await request('/api/auth/register', 'POST', {
      email: escalateEmail,
      password: testPassword,
      first_name: 'Hacker',
      last_name: 'User',
      role: 'SUPER_ADMIN',
      role_id: 1,
    });
    console.log('Escalation Register Response:', escRes.status, escRes.body.data?.user?.role);
    if (escRes.body.data?.user?.role?.name === 'SUPER_ADMIN') {
      throw new Error('SECURITY VIOLATION: Public registration allowed SUPER_ADMIN role assignment!');
    }

    // 7. Invalid email registration
    console.log('\n[5] Testing Invalid Email Registration...');
    const invEmailRes = await request('/api/auth/register', 'POST', {
      email: 'not-an-email',
      password: testPassword,
      first_name: 'Invalid',
      last_name: 'Email',
    });
    console.log('Invalid Email Response:', invEmailRes.status, invEmailRes.body);
    if (invEmailRes.status !== 400) {
      throw new Error('Invalid email should return 400');
    }

    // 8. Login with correct credentials
    console.log('\n[6] Testing Valid Login...');
    const loginRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    console.log('Login Response Status:', loginRes.status);
    if (loginRes.status !== 200 || !loginRes.body.data?.token) {
      throw new Error('Valid login failed');
    }
    jwtToken = loginRes.body.data.token;
    if (loginRes.body.data.user.password_hash) {
      throw new Error('SECURITY VIOLATION: password_hash leaked in login response!');
    }

    // 9. Login with incorrect password
    console.log('\n[7] Testing Invalid Login (Wrong Password)...');
    const wrongPassRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'WrongPassword123!',
    });
    console.log('Wrong Password Response:', wrongPassRes.status, wrongPassRes.body);
    if (wrongPassRes.status !== 401 || wrongPassRes.body.message !== 'Invalid email or password.') {
      throw new Error('Invalid login response must return generic error message');
    }

    // 10. GET /api/auth/me with valid token
    console.log('\n[8] Testing /api/auth/me with Valid Token...');
    const meRes = await request('/api/auth/me', 'GET', null, jwtToken);
    console.log('GET /me Response Status:', meRes.status, 'User:', meRes.body.user?.email);
    if (meRes.status !== 200 || !meRes.body.user || meRes.body.user.email !== testEmail) {
      throw new Error('GET /api/auth/me failed with valid token');
    }

    // 11. GET /api/auth/me without token
    console.log('\n[9] Testing /api/auth/me without Token...');
    const noTokenRes = await request('/api/auth/me', 'GET');
    console.log('No Token Response:', noTokenRes.status, noTokenRes.body);
    if (noTokenRes.status !== 401) {
      throw new Error('GET /api/auth/me without token should return 401');
    }

    // 12. GET /api/auth/me with invalid token
    console.log('\n[10] Testing /api/auth/me with Invalid Token...');
    const badTokenRes = await request('/api/auth/me', 'GET', null, 'invalid.jwt.token');
    console.log('Bad Token Response:', badTokenRes.status, badTokenRes.body);
    if (badTokenRes.status !== 401) {
      throw new Error('GET /api/auth/me with bad token should return 401');
    }

    // 13. Test suspended user login
    console.log('\n[11] Testing Suspended Account Login...');
    dbUser.status = 'SUSPENDED';
    await dbUser.save();
    const suspendedLoginRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    console.log('Suspended Login Response:', suspendedLoginRes.status, suspendedLoginRes.body);
    if (suspendedLoginRes.status !== 403) {
      throw new Error('Suspended user login should return 403 Forbidden');
    }

    // 14. Test Logout
    console.log('\n[12] Testing Logout Endpoint...');
    const logoutRes = await request('/api/auth/logout', 'POST');
    console.log('Logout Response:', logoutRes.status, logoutRes.body);
    if (logoutRes.status !== 200) {
      throw new Error('Logout endpoint failed');
    }

    console.log('\n✅ ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      server.close();
    }
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ AUTHENTICATION TEST SUITE FAILED:', err);
    process.exit(1);
  });

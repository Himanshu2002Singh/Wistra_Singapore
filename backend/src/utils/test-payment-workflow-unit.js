'use strict';

const assert = require('node:assert/strict');

// Exercise both Student-fee configuration states deterministically.
delete process.env.STUDENT_MEMBERSHIP_FEE;
const feePath = require.resolve('../services/feeCalculationService');
delete require.cache[feePath];
const unconfiguredFees = require('../services/feeCalculationService');
assert.equal(unconfiguredFees.calculateMembershipFee({ membershipType: 'INDIVIDUAL' }).total, 150);
assert.equal(unconfiguredFees.calculateMembershipFee({ membershipType: 'CORPORATE' }).total, 500);
assert.throws(() => unconfiguredFees.calculateMembershipFee({ membershipType: 'STUDENT' }), /Student membership fee is not configured/);

process.env.STUDENT_MEMBERSHIP_FEE = '75.50';
delete require.cache[feePath];
const configuredFees = require('../services/feeCalculationService');
assert.equal(configuredFees.calculateMembershipFee({ membershipType: 'STUDENT' }).total, 75.5);
process.env.STUDENT_MEMBERSHIP_FEE = '0';
delete require.cache[feePath];
assert.throws(() => require('../services/feeCalculationService').calculateMembershipFee({ membershipType: 'STUDENT' }), /Student membership fee is not configured/);

const { calculateMembershipPeriod } = require('../services/membershipActivationService');
assert.deepEqual(calculateMembershipPeriod(new Date('2026-10-20T12:00:00.000Z')), { start_date: '2026-06-01', end_date: '2027-05-31' });
assert.deepEqual(calculateMembershipPeriod(new Date('2027-02-01T12:00:00.000Z')), { start_date: '2026-06-01', end_date: '2027-05-31' });

console.log('Manual payment unit checks passed: configured membership fees, missing Student fee refusal, and June–May membership periods.');

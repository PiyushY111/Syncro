import assert from 'assert';
import {
  isDomainWhitelisted,
  DEFAULT_PLATFORM_SETTINGS,
} from '../services/gatekeeperService.js';
import { requireSuperAdmin } from '../middlewares/superAdminMiddleware.js';
import { redisCache } from '../config/redis.js';

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ ${desc}`);
  } catch (err) {
    console.error(`  ✖ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncIt(desc, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ ${desc}`);
  } catch (err) {
    console.error(`  ✖ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n====================================================');
console.log('🧪 Running Gatekeeper & Super-Admin Policy Unit Tests');
console.log('====================================================\n');

// 1. Domain Whitelist Tests
console.log('1. Domain Whitelist Matching Logic');
it('should correctly match exact domain', () => {
  const whitelisted = ['piyushydv.com', 'google.com'];
  assert.strictEqual(isDomainWhitelisted('alex@piyushydv.com', whitelisted), true);
  assert.strictEqual(isDomainWhitelisted('user@google.com', whitelisted), true);
  assert.strictEqual(isDomainWhitelisted('spammer@yahoo.com', whitelisted), false);
});

it('should handle @ prefixes gracefully in domain list', () => {
  const whitelisted = ['@company.io', 'syncro.dev'];
  assert.strictEqual(isDomainWhitelisted('lead@company.io', whitelisted), true);
  assert.strictEqual(isDomainWhitelisted('dev@syncro.dev', whitelisted), true);
});

it('should match corporate subdomains', () => {
  const whitelisted = ['acme.com'];
  assert.strictEqual(isDomainWhitelisted('engineer@eng.acme.com', whitelisted), true);
  assert.strictEqual(isDomainWhitelisted('random@other.com', whitelisted), false);
});

it('should return false for malformed or empty inputs', () => {
  assert.strictEqual(isDomainWhitelisted('', ['acme.com']), false);
  assert.strictEqual(isDomainWhitelisted(null, ['acme.com']), false);
  assert.strictEqual(isDomainWhitelisted('notanemail', ['acme.com']), false);
  assert.strictEqual(isDomainWhitelisted('user@test.com', []), false);
});

// 2. Default Configuration Invariants
console.log('\n2. Default Gatekeeper Configuration');
it('should have strict, secure default settings', () => {
  assert.ok(DEFAULT_PLATFORM_SETTINGS.userRegistrationMode);
  assert.ok(DEFAULT_PLATFORM_SETTINGS.workspaceCreationMode);
  assert.strictEqual(typeof DEFAULT_PLATFORM_SETTINGS.notifyAdminOnRequest, 'boolean');
  assert.strictEqual(typeof DEFAULT_PLATFORM_SETTINGS.autoApproveInvitedMembers, 'boolean');
  assert.strictEqual(Array.isArray(DEFAULT_PLATFORM_SETTINGS.whitelistedDomains), true);
});

// 3. Super-Admin Middleware Guards
console.log('\n3. Super-Admin Authorization Middleware');
await asyncIt('should reject unauthenticated request without user', async () => {
  const req = {};
  const res = {};
  let caughtError = null;
  const next = (err) => { caughtError = err; };

  await requireSuperAdmin(req, res, next);
  assert.ok(caughtError);
  assert.strictEqual(caughtError.errorCode, 'UNAUTHORIZED');
});

await asyncIt('should auto-elevate user if email in SUPER_ADMIN_EMAILS env', async () => {
  process.env.SUPER_ADMIN_EMAILS = 'master@piyushydv.com,founder@syncro.dev';
  const req = {
    user: { id: 'usr-1', email: 'master@piyushydv.com' },
  };
  const res = {};
  let nextCalled = false;
  let nextError = null;
  const next = (err) => {
    if (err) nextError = err;
    else nextCalled = true;
  };

  await requireSuperAdmin(req, res, next);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(nextError, null);
  assert.strictEqual(req.user.isSuperAdmin, true);
});

await asyncIt('should reject regular user with cached non-admin status', async () => {
  process.env.SUPER_ADMIN_EMAILS = 'master@piyushydv.com';
  await redisCache.set('user:is_superadmin:usr-unprivileged', 'false');

  const req = {
    user: { id: 'usr-unprivileged', email: 'regular@gmail.com' },
  };
  const res = {};
  let caughtError = null;
  const next = (err) => { caughtError = err; };

  await requireSuperAdmin(req, res, next);
  assert.ok(caughtError);
  assert.strictEqual(caughtError.errorCode, 'FORBIDDEN');
});

console.log('\n====================================================');
console.log(`Gatekeeper Unit Test Summary: ${passedTests}/${totalTests} Passed`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

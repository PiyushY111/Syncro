/**
 * ============================================================================
 * ROW-LEVEL SECURITY (RLS) TENANT ISOLATION VERIFICATION SUITE
 * ============================================================================
 * Proves — or disproves — that the Postgres RLS policies declared in
 * prisma/migrations/20260816_enable_rls/migration.sql actually isolate
 * tenants (Project/Channel/Meeting rows scoped by workspaceId).
 *
 * Context (see SECURITY.md "Known gaps" for the full writeup): the
 * application's own Prisma connection (server/src/config/prisma.js) never
 * calls set_config('app.current_workspace_id', ...), and it connects as the
 * role that owns these tables. Postgres does not apply RLS policies to a
 * table's owner unless the table has FORCE ROW LEVEL SECURITY, which this
 * migration does not set — so in production the policies are inert and
 * tenant isolation is enforced only by application-layer checks
 * (checkProjectAccessMiddleware and friends), not by the database.
 *
 * This suite does NOT change that. Its job is narrower and more useful for
 * regression coverage: it creates a throwaway, non-owner Postgres role with
 * only SELECT granted, proves the policies correctly isolate that role's
 * queries when app.current_workspace_id is set (transaction-local, via
 * set_config(..., true), the only safe way to do this over Prisma's pooled
 * connections), proves they fail CLOSED (zero rows) when the setting is
 * absent, and — critically — proves the app's actual unscoped owner
 * connection is NOT restricted at all. That last assertion is the receipt
 * for the doc claim removed elsewhere: RLS is not providing protection
 * today.
 *
 * Safety: this suite creates a Postgres role and writes/deletes fixture
 * rows. It refuses to run against anything other than a local Postgres
 * instance (localhost/127.0.0.1) so it can never touch the live Neon
 * database this repo's own .env may point at (see SECURITY.md). Run it via
 * a throwaway local/CI Postgres — see README.md "Testing & Verification".
 */

import { PrismaClient } from '@prisma/client';

let totalTests = 0;
let passedTests = 0;

function it(desc, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ ${desc}`);
  } else {
    console.error(`  ✖ ${desc}`);
  }
}

// Fixed, non-secret identifiers for a throwaway role on an ephemeral test
// database — created and dropped within this suite, never used outside it.
const TEST_ROLE = 'syncro_rls_isolation_test_role';
const TEST_ROLE_PASSWORD = 'rls-isolation-suite-throwaway-password';

function isLocalDatabaseUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function withRole(urlStr, user, password) {
  const parsed = new URL(urlStr);
  parsed.username = user;
  parsed.password = password;
  return parsed.toString();
}

async function run() {
  console.log('\n====================================================');
  console.log('🧪 Running RLS Tenant Isolation Verification Suite');
  console.log('====================================================\n');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !isLocalDatabaseUrl(dbUrl)) {
    console.log(
      '  ⚠️  DATABASE_URL is not a local Postgres instance (localhost/127.0.0.1).'
    );
    console.log(
      '     This suite provisions a throwaway Postgres role and writes/deletes fixture'
    );
    console.log(
      '     rows, so it refuses to run against anything else — including the live Neon'
    );
    console.log(
      '     database this repo\'s .env may point at. Point DATABASE_URL/DIRECT_URL at a'
    );
    console.log(
      '     local or CI Postgres (see README.md) to exercise this suite. Skipping.\n'
    );
    console.log('RLS Tenant Isolation Suite: skipped (not a local database)\n');
    process.exit(0);
  }

  const owner = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  let scoped;
  let userA;
  let userB;

  try {
    // --- Provision a throwaway, non-owner role with only SELECT ---------
    await owner.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_roles WHERE rolname = '${TEST_ROLE}') THEN
          EXECUTE 'DROP OWNED BY ${TEST_ROLE} CASCADE';
          EXECUTE 'DROP ROLE ${TEST_ROLE}';
        END IF;
      END $$;
    `);
    await owner.$executeRawUnsafe(
      `CREATE ROLE ${TEST_ROLE} LOGIN PASSWORD '${TEST_ROLE_PASSWORD}'`
    );
    await owner.$executeRawUnsafe(
      `GRANT SELECT ON "Project", "Channel", "Meeting" TO ${TEST_ROLE}`
    );

    scoped = new PrismaClient({
      datasources: { db: { url: withRole(dbUrl, TEST_ROLE, TEST_ROLE_PASSWORD) } },
    });

    // --- Fixture: two workspaces, each with a project/channel/meeting ---
    const suffix = Date.now();
    userA = await owner.user.create({
      data: { name: 'RLS Test User A', email: `rls-test-a-${suffix}@example.com` },
    });
    userB = await owner.user.create({
      data: { name: 'RLS Test User B', email: `rls-test-b-${suffix}@example.com` },
    });

    const wsA = await owner.workspace.create({
      data: { name: 'RLS Test WS A', slug: `rls-test-ws-a-${suffix}`, ownerId: userA.id },
    });
    const wsB = await owner.workspace.create({
      data: { name: 'RLS Test WS B', slug: `rls-test-ws-b-${suffix}`, ownerId: userB.id },
    });

    const projA = await owner.project.create({
      data: { name: 'RLS Test Project A', team_lead: userA.id, workspaceId: wsA.id },
    });
    const projB = await owner.project.create({
      data: { name: 'RLS Test Project B', team_lead: userB.id, workspaceId: wsB.id },
    });

    await owner.channel.create({ data: { name: 'RLS Test Channel A', workspaceId: wsA.id } });
    await owner.channel.create({ data: { name: 'RLS Test Channel B', workspaceId: wsB.id } });

    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    await owner.meeting.create({
      data: {
        title: 'RLS Test Meeting A',
        start_time: now,
        end_time: inOneHour,
        workspaceId: wsA.id,
        creatorId: userA.id,
      },
    });
    await owner.meeting.create({
      data: {
        title: 'RLS Test Meeting B',
        start_time: now,
        end_time: inOneHour,
        workspaceId: wsB.id,
        creatorId: userB.id,
      },
    });

    // --- 1. Non-owner role, scoped to workspace A: sees only A's rows ---
    console.log('1. Non-owner role scoped to workspace A (set_config, transaction-local)');
    const asA = await scoped.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${wsA.id}, true)`;
      return {
        projects: await tx.project.findMany(),
        channels: await tx.channel.findMany(),
        meetings: await tx.meeting.findMany(),
      };
    });
    it(
      'sees workspace A\'s project but not workspace B\'s',
      asA.projects.some((p) => p.id === projA.id) && !asA.projects.some((p) => p.id === projB.id)
    );
    it(
      'sees only workspace A\'s channel',
      asA.channels.length === 1 && asA.channels[0].workspaceId === wsA.id
    );
    it(
      'sees only workspace A\'s meeting',
      asA.meetings.length === 1 && asA.meetings[0].workspaceId === wsA.id
    );

    // --- 2. Symmetric check scoped to workspace B ------------------------
    console.log('\n2. Non-owner role scoped to workspace B');
    const asB = await scoped.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${wsB.id}, true)`;
      return { projects: await tx.project.findMany() };
    });
    it(
      'sees workspace B\'s project but not workspace A\'s',
      asB.projects.some((p) => p.id === projB.id) && !asB.projects.some((p) => p.id === projA.id)
    );

    // --- 3. Direct point lookup of the other tenant's row is blocked ----
    console.log('\n3. Direct lookup of another tenant\'s row (not just findMany filtering)');
    const crossRead = await scoped.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${wsA.id}, true)`;
      return tx.project.findFirst({ where: { id: projB.id } });
    });
    it('workspace A\'s scope cannot read workspace B\'s project by id', crossRead === null);

    // --- 4. Fail-closed: non-owner role with the setting never applied --
    console.log('\n4. Non-owner role with app.current_workspace_id never set (fail-closed)');
    const unscoped = await scoped.project.findMany();
    it(
      'sees zero rows when the workspace scope was never set',
      unscoped.length === 0
    );

    // --- 5. The app's REAL connection (table owner) is not restricted ---
    console.log('\n5. Owner role (what the application actually connects as today)');
    const ownerView = await owner.project.findMany({
      where: { id: { in: [projA.id, projB.id] } },
    });
    it(
      'owner role sees both tenants\' projects with no scope set — RLS provides no ' +
        'protection for the app\'s actual connection today',
      ownerView.length === 2
    );

    console.log('\n====================================================');
    console.log(`RLS Tenant Isolation Suite: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');

    if (passedTests !== totalTests) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('RLS isolation suite error:', err);
    process.exitCode = 1;
  } finally {
    try {
      if (userA) await owner.user.delete({ where: { id: userA.id } }).catch(() => {});
      if (userB) await owner.user.delete({ where: { id: userB.id } }).catch(() => {});
      await owner.$executeRawUnsafe(`DROP OWNED BY ${TEST_ROLE} CASCADE`).catch(() => {});
      await owner.$executeRawUnsafe(`DROP ROLE IF EXISTS ${TEST_ROLE}`).catch(() => {});
    } finally {
      await owner.$disconnect();
      if (scoped) await scoped.$disconnect();
    }
  }
}

run();

import { spawn } from 'child_process';
import path from 'path';

const testSuites = [
  { name: 'Architecture & CI Guard Suite', file: 'tests/architecture.test.js' },
  { name: 'Security & Cryptographic Suite', file: 'tests/security.test.js' },
  { name: 'Shield Zero-Trust Cryptographic Suite', file: 'tests/shield.test.js' },
  { name: 'Shield End-to-End Cloaked Gateway Suite', file: 'tests/shieldE2E.test.js' },
  { name: 'Transaction, Outbox & DLQ Suite', file: 'tests/transaction.test.js' },
  { name: 'Domain Invariants & Business Logic Suite', file: 'tests/domainInvariants.test.js' },
  { name: 'Gatekeeper & Super-Admin Policy Suite', file: 'tests/gatekeeper.test.js' },
  { name: 'Concurrency & Stampede Lock Suite', file: 'tests/concurrency.test.js' },
];

async function runSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n====================================================`);
    console.log(`Executing: ${suite.name} (${suite.file})`);
    console.log(`====================================================\n`);

    const startMs = Date.now();
    const child = spawn('node', [suite.file], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startMs) / 1000).toFixed(2);
      resolve({
        name: suite.name,
        file: suite.file,
        passed: code === 0,
        duration: `${duration}s`,
      });
    });
  });
}

async function runEnterpriseTestingFramework() {
  console.log(`
  SYNCRO ENTERPRISE TEST SUITE ORCHESTRATOR
  `);

  const startTime = Date.now();
  const results = [];

  for (const suite of testSuites) {
    const res = await runSuite(suite);
    results.push(res);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  console.log(`\n====================================================`);
  console.log(`GRAND SUMMARY: ENTERPRISE TEST SUITE RESULTS`);
  console.log(`====================================================`);

  results.forEach((r) => {
    const status = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} | ${r.name.padEnd(40)} | Duration: ${r.duration}`);
  });

  console.log(`----------------------------------------------------`);
  console.log(`Total Execution Time: ${totalTime}s`);
  console.log(`Suites Passed: ${totalPassed}/${results.length}`);
  console.log(`Suites Failed: ${totalFailed}/${results.length}`);
  console.log(`====================================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runEnterpriseTestingFramework();

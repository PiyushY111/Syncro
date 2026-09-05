import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/auth.test.js',
      'tests/chat.test.js',
      'tests/comment.test.js',
      'tests/epic.test.js',
      'tests/inbox.test.js',
      'tests/permissions.test.js',
      'tests/rateLimit2FA.test.js',
      'tests/redis.test.js',
      'tests/subteam.test.js',
      'tests/workspace.test.js'
    ],
  },
});

export default [
  {
    ignores: ['node_modules/', 'tests/', 'dist/'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'error',
    },
  },
];

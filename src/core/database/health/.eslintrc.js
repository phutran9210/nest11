module.exports = {
  rules: {
    // Disable SQL dialect warning for database health checks
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        // This is a workaround for SQL dialect warnings in TypeORM queries
        'no-template-curly-in-string': 'off',
      },
    },
  ],
};
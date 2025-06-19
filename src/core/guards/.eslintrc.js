module.exports = {
  rules: {
    // Disable unsafe TypeScript rules for guard files due to Express request typing complexity
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};
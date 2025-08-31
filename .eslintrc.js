module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:github/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'github/no-then': 'off',
    'no-console': 'warn', // Allow console statements for logging
    'camelcase': 'off', // Allow snake_case for API responses
    'i18n-text/no-en': 'off' // Allow English text in GitHub Actions
  },
  env: {
    node: true,
    jest: true
  }
};

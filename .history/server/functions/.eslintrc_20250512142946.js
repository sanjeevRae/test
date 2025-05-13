module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "no-prototype-builtins": "warn",
    "no-unused-vars": "warn",
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['**/test/e2e/**/*.e2e.test.js'],
  testTimeout: 15000,
  globalSetup: './test/e2e/setup/global-setup.js',
  globalTeardown: './test/e2e/setup/global-teardown.js',
  maxWorkers: 1,
};
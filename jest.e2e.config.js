module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/e2e.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    verbose: true,
    collectCoverage: false,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
}; 
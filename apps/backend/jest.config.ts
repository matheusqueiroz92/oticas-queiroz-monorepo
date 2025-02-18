export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!**/node_modules/**", "!**/tests/**"],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      statements: 80,
      branches: 80,
    },
  },
};

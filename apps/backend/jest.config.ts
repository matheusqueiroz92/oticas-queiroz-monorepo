export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testTimeout: 10000,
  setupFilesAfterEnv: ["./src/tests/setup.ts"],
};

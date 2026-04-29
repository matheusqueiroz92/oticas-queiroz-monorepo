export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
  collectCoverage: false, // Desabilitar cobertura global
  coverageReporters: ["text", "lcov", "json"],
  verbose: false,
  silent: true,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/node_modules/**",
    "!**/tests/**",
    "!src/__tests__/**",
    // Entry points and infra files not exercised in unit/integration tests
    "!src/server.ts",
    "!src/config/env.ts",
    // Type declarations
    "!src/types/**",
    // Example/documentation files
    "!src/repositories/examples/**",
    // Utilities explicitly excluded
    "!src/utils/getMercadoPagoLinkSimple.ts",
    "!src/utils/test*.ts",
    "!src/utils/exportUtils.ts",
    "!src/scripts/**",
  ],
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 42,
      functions: 62,
      lines: 55,
    },
  },
  // Configurações específicas para TypeScript
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  extensionsToTreatAsEsm: [],
  // Ignora problemas de importação de alguns módulos
  transformIgnorePatterns: [
    "node_modules/(?!(mongodb-memory-server|mercadopago)/)",
  ],
  // Força o reset de módulos entre os testes
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
}; 
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "json"],
  collectCoverageFrom: [
    "src/**/*.ts", 
    "!**/node_modules/**", 
    "!**/tests/**", 
    "!src/__tests__/**",
    "!src/utils/getMercadoPagoLinkSimple.ts",
    "!src/utils/test*.ts",
    "!src/scripts/**",
    "!src/utils/exportUtils.ts"
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      statements: 80,
      branches: 80,
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
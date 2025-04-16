const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Adicione os módulos e arquivos a serem ignorados ou mockados
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // Ignorar node_modules para que o Jest não tente transformar módulos de terceiros
  transformIgnorePatterns: [
    '/node_modules/(?!(@next/*))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Adicionar o transformador do Babel para lidar com JSX
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Escolher o ambiente de teste (jsdom para aplicações web)
  testEnvironment: 'jsdom',
  // Configurar a cobertura de teste
  collectCoverage: false,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/*.config.js',
    '!**/coverage/**',
  ],
  // Configurar os diretórios de teste
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // Configurar os arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Configurar o diretório de saída dos testes
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
import baseConfig from "./jest.config";

export default {
  ...baseConfig,
  testMatch: [
    "**/orderDebtMath.test.ts",
    "**/BotApiDtos.test.ts",
    "**/ClientDebtQueryService.test.ts",
    "**/GetBotOrderByOsUseCase.test.ts",
    "**/GetBotCustomerDebtsByCpfUseCase.test.ts",
    "**/ProcessBotInboundMessageUseCase.test.ts",
    "**/BotChatSessionService.test.ts",
    "**/botMessageFormatters.test.ts",
    "**/botInboundNormalize.test.ts",
    "**/botApiKeyMiddleware.test.ts",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/useCases/bot/**/*.ts",
    "src/services/BotChatSessionService.ts",
    "src/services/ClientDebtQueryService.ts",
    "src/middlewares/botApiKeyMiddleware.ts",
    "src/utils/orderDebtMath.ts",
    "src/utils/botMessageFormatters.ts",
    "src/utils/botInboundNormalize.ts",
    "src/dto/bot/BotApiDtos.ts",
  ],
  coveragePathIgnorePatterns: ["src/dto/bot/BotWebhookDtos.ts"],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 75,
      functions: 95,
      lines: 95,
    },
  },
};

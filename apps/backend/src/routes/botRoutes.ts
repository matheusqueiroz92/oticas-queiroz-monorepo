import { Router } from "express";
import { BotController } from "../controllers/BotController";
import { asyncHandler } from "../utils/asyncHandler";
import { botApiKeyMiddleware } from "../middlewares/botApiKeyMiddleware";
import { botChatLimiter } from "../config/rateLimit";

const router = Router();
const botController = new BotController();

router.use(botApiKeyMiddleware);
router.use(botChatLimiter);

router.post(
  "/chat",
  asyncHandler(botController.processInboundMessage.bind(botController))
);

router.get(
  "/order/:os_number",
  asyncHandler(botController.getOrderByOs.bind(botController))
);

// POST para que o CPF não apareça em access logs do Traefik/nginx (M1)
router.post(
  "/customer/debts",
  asyncHandler(botController.getCustomerDebtsByCpf.bind(botController))
);

export default router;

import { Router } from "express";
import { BotController } from "../controllers/BotController";
import { asyncHandler } from "../utils/asyncHandler";
import { botApiKeyMiddleware } from "../middlewares/botApiKeyMiddleware";

const router = Router();
const botController = new BotController();

router.use(botApiKeyMiddleware);

router.post(
  "/chat",
  asyncHandler(botController.processInboundMessage.bind(botController))
);

router.get(
  "/order/:os_number",
  asyncHandler(botController.getOrderByOs.bind(botController))
);

router.get(
  "/customer/debts/:cpf",
  asyncHandler(botController.getCustomerDebtsByCpf.bind(botController))
);

export default router;

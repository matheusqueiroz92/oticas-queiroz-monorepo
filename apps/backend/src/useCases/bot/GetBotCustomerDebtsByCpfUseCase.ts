import {
  mapClientDebtsToBotDto,
  type BotCustomerDebtsResponse,
} from "../../dto/bot/BotApiDtos";
import { ClientDebtQueryService } from "../../services/ClientDebtQueryService";
import { UserService } from "../../services/UserService";
import { NotFoundError } from "../../utils/AppError";
import { ErrorCode } from "../../utils/errorCodes";

const CUSTOMER_NOT_FOUND_MESSAGE =
  "Não encontramos um cliente cadastrado com este CPF.";

function normalizeCpfParam(raw: string): string {
  return decodeURIComponent(String(raw ?? "")).replace(/\D/g, "");
}

export class GetBotCustomerDebtsByCpfUseCase {
  constructor(
    private readonly userService: UserService = new UserService(),
    private readonly clientDebtQueryService: ClientDebtQueryService = new ClientDebtQueryService()
  ) {}

  async execute(cpfRaw: string): Promise<BotCustomerDebtsResponse> {
    const cpfDigits = normalizeCpfParam(cpfRaw);

    let client;
    try {
      client = await this.userService.getUserByCpf(cpfDigits);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new NotFoundError(
          CUSTOMER_NOT_FOUND_MESSAGE,
          ErrorCode.USER_NOT_FOUND
        );
      }
      throw err;
    }

    if (client.role !== "customer") {
      throw new NotFoundError(
        CUSTOMER_NOT_FOUND_MESSAGE,
        ErrorCode.USER_NOT_FOUND
      );
    }

    const clientId =
      typeof client._id === "string" ? client._id : String(client._id);
    const data = await this.clientDebtQueryService.getClientDebtsData(clientId);
    return mapClientDebtsToBotDto(cpfDigits, data);
  }
}

/**
 * Constantes para as query keys do React Query.
 * Organizadas por entidade e com funções para criar keys parametrizadas.
 */

export const QUERY_KEYS = {
  // Autenticação
  AUTH: {
    USER_PROFILE: ["auth", "profile"],
  },

  // Laboratórios
  LABORATORIES: {
    ALL: ["laboratories"],
    PAGINATED: (page = 1, filters = {}) => [
      "laboratories",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["laboratories", "detail", id],
    ACTIVE: ["laboratories", "active"],
  },

  // Pedidos
  ORDERS: {
    ALL: ["orders"],
    PAGINATED: (page = 1, filters = {}) => [
      "orders",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["orders", "detail", id],
    CLIENT: (clientId: string) => ["orders", "client", clientId],
    DAILY: ["orders", "daily"],
  },

  // Produtos
  PRODUCTS: {
    ALL: ["products"],
    PAGINATED: (page = 1, filters = {}) => [
      "products",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["products", "detail", id],
    BY_CATEGORY: (category: string) => ["products", "category", category],
  },

  // Pagamentos
  PAYMENTS: {
    ALL: ["payments"],
    PAGINATED: (page = 1, filters = {}) => [
      "payments",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["payments", "detail", id],
    DAILY: ["payments", "daily"],
    BY_CASH_REGISTER: (cashRegisterId: string) => [
      "payments",
      "cashRegister",
      cashRegisterId,
    ],
  },

  // Caixas
  CASH_REGISTERS: {
    ALL: ["cashRegisters"],
    PAGINATED: (page = 1, filters = {}) => [
      "cashRegisters",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["cashRegisters", "detail", id],
    CURRENT: ["cashRegisters", "current"],
    SUMMARY: (id: string) => ["cashRegisters", "summary", id],
    DAILY_SUMMARY: ["cashRegisters", "dailySummary"],
  },

  // Relatórios
  REPORTS: {
    ALL: ["reports"],
    PAGINATED: (page = 1, filters = {}) => [
      "reports",
      "paginated",
      page,
      filters,
    ],
    DETAIL: (id: string) => ["reports", "detail", id],
  },
};

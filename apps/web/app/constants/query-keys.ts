export const QUERY_KEYS = {
  AUTH: {
    USER_PROFILE: ["auth", "profile"],
    USER_DATA: ["auth", "user-data"],
  },

  USERS: {
    ALL: ["users"],
    DETAIL: (id: string) => ["users", "detail", id],
    CUSTOMERS: (search?: string) => ["users", "customers", search],
    EMPLOYEES: (search?: string) => ["users", "employees", search],
    ADMINS: (search?: string) => ["users", "admins", search],
    VENDORS: (search?: string) => ["users", "vendors", search],
  },

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

  ORDERS: {
    ALL: 'orders',
    PAGINATED: (page = 1, filters = {}) => ['orders', 'list', page, JSON.stringify(filters)],
    DETAIL: (id: string) => ['orders', 'detail', id],
    CLIENT: (clientId: string) => ["orders", "client", clientId],
    DAILY: ["orders", "daily"],
  },

  PRODUCTS: {
    ALL: ['products'],
    PAGINATED: (page?: number, filters?: Record<string, any>) => 
      ['products', 'paginated', page, filters],
    DETAIL: (id: string) => ['products', 'detail', id],
    STOCK_HISTORY: (id: string) => ['products', 'stock-history', id],
  },

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
    OPEN: ["cashRegisters", "current", "open"],
    SUMMARY: (id: string) => ["cashRegisters", "summary", id],
    DAILY_SUMMARY: ["cashRegisters", "dailySummary"],
  },

  LEGACY_CLIENT: {
    ALL: ["legacyClients"],
    DETAIL: (id: string) => ["legacyClients", "detail", id],
    SEARCH: (identifier: string) => ["legacyClients", "search", identifier],
    DEBTORS: ["legacyClients", "debtors"],
    PAYMENT_HISTORY: (id: string) => ["legacyClients", "paymentHistory", id],
  },

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

export const QUERY_KEYS = {
  AUTH: {
    USER_PROFILE: ["auth", "profile"],
    USER_DATA: ["auth", "user-data"],
  },

  USERS: {
    ALL: ["users"],
    DETAIL: (id: string) => ["users", "detail", id],
    CUSTOMERS: (search?: string, page?: number, limit?: number, filters?: string) => 
      ["users", "customers", search, page, limit, filters],
    EMPLOYEES: (search?: string, page?: number, limit?: number) => 
      ["users", "employees", search, page, limit],
    INSTITUTIONS: (search?: string, page?: number, pageSize?: number) => 
      ["users", "institutions", search, page, pageSize],
    ADMINS: (search?: string) => ["users", "admins", search],
    VENDORS: (search?: string) => ["users", "vendors", search],
    BASE: () => ["users"],
    TOTAL_CUSTOMERS: ["users", "total-customers"]
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
    MY_ORDERS: ["orders", "my-orders"],
    PROFILE_ALL: (userId: string, userRole: string) => ["orders", "profile-all", userId, userRole],
    DAILY: ["orders", "daily"],
    NEXT_SERVICE_ORDER: ["orders", "next-service-order"],
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
    MY_DEBTS: ["payments", "my-debts"],
    MY_PAYMENTS: (filters = {}) => ["payments", "my-payments", filters],
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

  MERCADO_PAGO: {
    PREFERENCE: (orderId: string) => ["mercadopago", "preference", orderId],
    PAYMENT_INFO: (preferenceId: string) => ["mercadopago", "payment-info", preferenceId],
    PROCESS_PAYMENT: (paymentId: string) => ["mercadopago", "process", paymentId],
  },
};
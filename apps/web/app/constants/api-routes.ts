export const API_ROUTES = {
  ORDERS: {
    BASE: "/api/orders",
    LIST: '/api/orders',
    CREATE: '/api/orders',
    BY_ID: (id: string) => `/api/orders/${id}`,
    UPDATE: (id: string) => `/api/orders/${id}`,
    DELETE: (id: string) => `/api/orders/${id}/delete`,
    CANCEL: (id: string) => `/api/orders/${id}/cancel`,
    STATUS: (id: string) => `/api/orders/${id}/status`,
    LABORATORY: (id: string) => `/api/orders/${id}/laboratory`,
    DAILY: "api/orders/daily",
    EXPORT: "/api/orders/export",
    EXPORT_DETAILS: (id: string) => `/api/orders/${id}/export`,
    EXPORT_DAILY: "api/orders/export/daily",
    CLIENT: (id: string) => `/api/orders/client/${id}`,
    PARAMS: (params: string) => `/api/orders?${params}`
  },
  CASH_REGISTERS: {
    BASE: "/api/cash-registers",
    OPEN: "/api/cash-registers/open",
    CLOSE: "/api/cash-registers/close",
    CURRENT: "/api/cash-registers/current",
    BY_ID: (id: string) => `/api/cash-registers/${id}`,
    SUMMARY: (id: string) => `/api/cash-registers/${id}/summary`,
    EXPORT: (id: string) => `/api/cash-registers/${id}/export`,
    DAILY_SUMMARY: "/api/cash-registers/summary/daily",
    EXPORT_DAILY: "/api/cash-registers/export/daily",
    SOFT_DELETE: (id: string) => `/api/cash-registers/${id}/delete`,
    DELETED: "/api/cash-registers/deleted",
  },
  PAYMENTS: {
    BASE: "/api/payments",
    BY_ID: (id: string) => `/api/payments/${id}`,
    CANCEL: (id: string) => `/api/payments/${id}/cancel`,
    DAILY: "/api/payments/daily",
    EXPORT: "/api/payments/export",
    DAILY_REPORT: "/api/payments/report/daily",
  },
  LABORATORIES: {
    BASE: "/api/laboratories",
    BY_ID: (id: string) => `/api/laboratories/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/laboratories/${id}/toggle-status`,
    ACTIVE: "/api/laboratories?isActive=true",
  },
  PRODUCTS: {
    BASE: "/api/products",
    BY_ID: (id: string) => `/api/products/${id}`,
    CATEGORY: (category: string) => `/api/products?category=${category}`,
  },
  USERS: {
    BASE: "/api/users",
    LIST: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    SEARCH: (query: string) => `/api/users/search?q=${query}`,
    PROFILE: "/api/users/profile",
    CUSTOMERS: "/api/users?role=customer",
    EMPLOYEES: "/api/users?role=employee",
    CUSTOMERS_PAGINATED: (page: number, limit: number = 10) => 
      `/api/users?role=customer&page=${page}&limit=${limit}`,
    EMPLOYEES_PAGINATED: (page: number, limit: number = 10) => 
      `/api/users?role=employee&page=${page}&limit=${limit}`,
    EXPORT: "/api/users/export",
    PARAMS: (params: string) => `/api/users?${params}`
  },
  REPORTS: {
    BASE: "/api/reports",
    BY_ID: (id: string) => `/api/reports/${id}`,
    DOWNLOAD: (id: string) => `/api/reports/${id}/download`,
  },
  LEGACY_CLIENTS: {
    BASE: "/api/legacy-clients",
    LIST: '/api/legacy-clients',
    CREATE: '/api/legacy-clients',
    BY_ID: (id: string) => `/api/legacy-clients/${id}`,
    UPDATE: (id: string) => `/api/legacy-clients/${id}`,
    SEARCH: (document: string) => `/api/legacy-clients/search?document=${document}`,
    DEBTORS: "/api/legacy-clients/debtors",
    PAYMENT_HISTORY: (id: string) => `/api/legacy-clients/${id}/payment-history`,
    TOGGLE_STATUS: (id: string) => `/api/legacy-clients/${id}/toggle-status`,
  },
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    PROFILE: "/api/users/profile",
    CHANGE_PASSWORD: "/api/users/change-password",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    VALIDATE_RESET_TOKEN: (token: string) =>
      `/api/auth/validate-reset-token/${token}`,
  },
};
export const API_ROUTES = {
  ORDERS: {
    BASE: "/api/orders",
    BY_ID: (id: string) => `/api/orders/${id}`,
    STATUS: (id: string) => `/api/orders/${id}/status`,
    LABORATORY: (id: string) => `/api/orders/${id}/laboratory`,
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
    BY_ID: (id: string) => `/api/users/${id}`,
    CUSTOMERS: "/api/users?role=customer",
    EMPLOYEES: "/api/users?role=employee",
  },
  REPORTS: {
    BASE: "/api/reports",
    BY_ID: (id: string) => `/api/reports/${id}`,
    DOWNLOAD: (id: string) => `/api/reports/${id}/download`,
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

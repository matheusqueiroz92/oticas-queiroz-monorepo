export interface IMercadoPagoPreference {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    picture_url?: string;
    category_id?: string;
    quantity: number;
    currency_id?: string;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      street_name?: string;
      street_number?: number;
      zip_code?: string;
    };
  };
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  external_reference?: string;
  back_urls?: {
    success?: string;
    pending?: string;
    failure?: string;
  };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  statement_descriptor?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
}

// Interface para resposta de criação de preferência
export interface IMercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

// Interface para webhook de notificação de pagamento
export interface IMercadoPagoWebhook {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

// Interface para informações detalhadas de pagamento
export interface IMercadoPagoPaymentInfo {
  id: number;
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  money_release_date: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  collector_id: number;
  external_reference?: string; // Adicionado
  metadata?: {
    order_id?: string;
    [key: string]: any;
  };
  payer: {
    id: number;
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  additional_info: Record<string, any>;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount: number;
  };
  installments: number;
  card?: {
    id: string;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    date_created: string;
    date_last_updated: string;
    cardholder: {
      name: string;
      identification: {
        number: string;
        type: string;
      };
    };
  };
}
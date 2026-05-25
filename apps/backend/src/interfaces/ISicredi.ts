// Interfaces para integração com API da Cobrança SICREDI v3.8

export interface SicrediBoletoRequest {
  // Header params (sent as HTTP headers, not body)
  // cooperativa and posto come from config — not in this interface

  // Required body fields
  tipoCobranca: 'NORMAL' | 'HIBRIDO';
  codigoBeneficiario: string;   // 5 chars
  especieDocumento:
    | 'DUPLICATA_MERCANTIL_INDICACAO'
    | 'DUPLICATA_RURAL'
    | 'NOTA_PROMISSORIA'
    | 'NOTA_PROMISSORIA_RURAL'
    | 'NOTA_SEGUROS'
    | 'RECIBO'
    | 'LETRA_CAMBIO'
    | 'NOTA_DEBITO'
    | 'DUPLICATA_SERVICO_INDICACAO'
    | 'OUTROS'
    | 'BOLETO_PROPOSTA'
    | 'CARTAO_CREDITO'
    | 'BOLETO_DEPOSITO';
  seuNumero: string;            // max 10 chars — internal control number
  dataVencimento: string;       // YYYY-MM-DD
  valor: number;

  pagador: {
    tipoPessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
    documento: string;          // CPF (11 digits) or CNPJ (14 digits), no formatting
    nome: string;               // max 200 chars (truncated at 40 on output)
    endereco: string;           // max 40 chars
    cidade: string;             // max 40 chars
    uf: string;                 // 2-char state abbreviation
    cep?: string;               // 8 digits, no formatting
    telefone?: string;          // max 11 digits
    email?: string;             // max 40 chars
  };

  // Optional body fields
  nossoNumero?: string;         // 9 chars — Sicredi generates automatically if omitted
  idTituloEmpresa?: string;     // max 25 chars
  diasProtestoAuto?: number;    // 3–99 days; mutually exclusive with diasNegativacaoAuto
  diasNegativacaoAuto?: number; // mutually exclusive with diasProtestoAuto
  validadeAposVencimento?: number; // days QR Code stays valid past due date (HIBRIDO only)

  tipoDesconto?: 'VALOR' | 'PERCENTUAL';
  valorDesconto1?: number;
  dataDesconto1?: string;       // YYYY-MM-DD
  valorDesconto2?: number;
  dataDesconto2?: string;
  valorDesconto3?: number;
  dataDesconto3?: string;
  descontoAntecipado?: number;  // mutually exclusive with valorDesconto1/2/3

  tipoJuros?: 'VALOR' | 'PERCENTUAL';
  juros?: number;               // daily interest amount/rate
  multa?: number;               // late fee percentage (max 5,2)

  informativo?: string[];       // up to 5 items, 80 chars each
  mensagem?: string[];          // up to 4 items, 80 chars each
}

export interface SicrediBoletoResponse {
  status: 'success' | 'error';
  data?: {
    nossoNumero: string;
    codigoBarras: string;
    linhaDigitavel: string;
    qrCode?: string;
    txid?: string;              // Pix transaction ID (HIBRIDO only)
    cooperativa?: string;
    posto?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SicrediTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;           // 300 seconds
  scope: string;
}

export interface SicrediBoletoStatus {
  linhaDigitavel: string;
  codigoBarras: string;
  carteira: string;
  seuNumero: string;
  nossoNumero: string;
  // Sicredi v3.8 retorna 'situacao' indicando o estado de REGISTRO do titulo
  // (REGISTRADO, BAIXADO, PROTESTADO...). Esse campo NAO muda para "PAGO"
  // quando o cliente paga — a SICREDI sinaliza o pagamento via
  // dataPagamento/valorPago/dataLiquidacao no payload.
  situacao?: string;
  valor?: number;
  valorPago?: number;
  // Alguns ambientes/versoes retornam dataLiquidacao em vez de dataPagamento
  valorLiquidacao?: number;
  dataVencimento?: string;      // YYYY-MM-DD
  dataPagamento?: string;       // YYYY-MM-DD
  dataLiquidacao?: string;      // YYYY-MM-DD
  dataBaixa?: string;
  pagador?: {
    documento: string;
    nome: string;
  };
  [key: string]: unknown;       // Campos extras retornados pela SICREDI
}

export interface SicrediBoletoStatusResponse {
  status: 'success' | 'error';
  data?: SicrediBoletoStatus;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SicrediCancelBoletoResponse {
  status: 'success' | 'error';
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

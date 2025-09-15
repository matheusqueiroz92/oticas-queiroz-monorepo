// Interfaces para integração com API da SICREDI

export interface SicrediBoletoRequest {
  // Dados do pagador
  pagador: {
    cpfCnpj: string;
    nome: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  
  // Dados do boleto
  boleto: {
    seuNumero: string; // Número de controle interno
    valor: number;
    dataVencimento: string; // formato: YYYY-MM-DD
    dataEmissao: string; // formato: YYYY-MM-DD
    dataLimite: string; // formato: YYYY-MM-DD
    valorAbatimento?: number;
    valorDesconto?: number;
    valorMora?: number;
    valorMulta?: number;
    mensagem?: string;
    nossoNumero?: string;
  };
  
  // Dados da cobrança
  cobranca: {
    codigoBeneficiario: string;
    codigoPosto: string;
    especieDocumento: string; // "01" = Duplicata, "02" = Nota Promissória, etc.
    numeroParcela?: number;
    totalParcelas?: number;
  };
}

export interface SicrediBoletoResponse {
  status: 'success' | 'error';
  data?: {
    nossoNumero: string;
    codigoBarras: string;
    linhaDigitavel: string;
    pdfUrl?: string;
    qrCode?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SicrediTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface SicrediBoletoStatus {
  nossoNumero: string;
  seuNumero: string;
  status: 'REGISTRADO' | 'BAIXADO' | 'PAGO' | 'VENCIDO' | 'PROTESTADO' | 'CANCELADO';
  valor: number;
  valorPago?: number;
  dataVencimento: string;
  dataPagamento?: string;
  dataBaixa?: string;
}

export interface SicrediBoletoStatusResponse {
  status: 'success' | 'error';
  data?: SicrediBoletoStatus;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SicrediCancelBoletoRequest {
  nossoNumero: string;
  motivo: 'ACERTOS' | 'APEDIDODOCLIENTE' | 'PAGODIRETOAOCLIENTE' | 'SUBSTITUICAO' | 'FALTADESOLUCAO' | 'APEDIDODOBENEFICIARIO';
}

export interface SicrediCancelBoletoResponse {
  status: 'success' | 'error';
  data?: {
    nossoNumero: string;
    status: 'CANCELADO';
    dataCancelamento: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

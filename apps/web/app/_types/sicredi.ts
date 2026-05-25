export interface SicrediCustomerAddress {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface SicrediCustomerData {
  cpfCnpj: string;
  nome: string;
  endereco: SicrediCustomerAddress;
}

export interface SicrediBoletoData {
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  qrCode?: string;
}

export interface EmittedSicrediBoletoItem {
  payment: import("./payment").IPayment;
  boleto: SicrediBoletoData;
  installmentNumber?: number;
  installmentTotal?: number;
}

export interface EmitOrderSicrediBoletoResponse {
  success: boolean;
  message: string;
  payment: import("./payment").IPayment;
  boleto: SicrediBoletoData;
  boletos?: EmittedSicrediBoletoItem[];
  alreadyIssued?: boolean;
}

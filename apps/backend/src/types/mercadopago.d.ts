declare module 'mercadopago' {
  // Definição de tipo para 'preferences'
  interface PreferencesInterface {
    create: (preference: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    update: (id: string, preference: any) => Promise<any>;
  }

  // Definição de tipo para 'payment'
  interface PaymentInterface {
    get: (id: string) => Promise<any>;
    search: (options: any) => Promise<any>;
    create: (payment: any) => Promise<any>;
    cancel: (id: string) => Promise<any>;
    capture: (id: string) => Promise<any>;
    refund: (id: string) => Promise<any>;
  }

  interface MercadopagoStatic {
    configure: (options: { access_token: string }) => void;
    preferences: PreferencesInterface;
    payment: PaymentInterface;
  }

  const mercadopago: MercadopagoStatic;
  export default mercadopago;
}
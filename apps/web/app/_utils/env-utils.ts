/**
 * Verifica se a aplicação está rodando em ambiente de desenvolvimento
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  
  /**
   * Verifica se a aplicação está rodando em ambiente de produção
   */
  export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  /**
   * Registra logs apenas em ambiente de desenvolvimento
   */
  export function devLog(...args: any[]): void {
    if (isDevelopment()) {
      console.log(...args);
    }
  }
  
  /**
   * Registra mensagens de diagnóstico para depuração em produção
   * Esta função pode ser usada para diagnosticar problemas em produção
   * sem encher o console com logs desnecessários em desenvolvimento
   */
  export function diagnosticLog(...args: any[]): void {
    // Para diagnosticar problemas em produção
    if (isProduction()) {
      // Prefixar com timestamp para facilitar análise
      const timestamp = new Date().toISOString();
      console.log(`[DIAGNOSTIC ${timestamp}]`, ...args);
    }
  }
import { PaymentService } from '../services/PaymentService';
import { UserService } from '../services/UserService';
import { LegacyClientService } from '../services/LegacyClientService';
import { OrderService } from '../services/OrderService';
import { SicrediSyncService } from '../services/SicrediSyncService';


/**
 * Script para iniciar a sincronização automática da SICREDI
 * Este script deve ser executado quando o servidor iniciar
 */
export async function startSicrediSync(): Promise<void> {
  try {
    console.log('🚀 Iniciando sincronização automática da SICREDI...');
    
    // Inicializar serviços (eles usam RepositoryFactory internamente)
const paymentService = new PaymentService();
const userService = new UserService();
const legacyClientService = new LegacyClientService();
const orderService = new OrderService();

    // Inicializar serviço de sincronização
    const sicrediSyncService = new SicrediSyncService(
      paymentService,
      userService,
      legacyClientService,
      orderService
    );

    // Verificar se a sincronização automática está habilitada
    const autoSyncEnabled = process.env.SICREDI_AUTO_SYNC === 'true';
    const syncInterval = parseInt(process.env.SICREDI_SYNC_INTERVAL || '30');

    if (autoSyncEnabled) {
      console.log(`✅ SICREDI: Sincronização automática habilitada (intervalo: ${syncInterval} minutos)`);
      
      // Iniciar sincronização automática
      sicrediSyncService.startAutoSync(syncInterval);
      
      // Executar primeira sincronização após 1 minuto
      setTimeout(async () => {
        try {
          console.log('🔄 SICREDI: Executando primeira sincronização...');
          const result = await sicrediSyncService.performSync();
          console.log(`✅ SICREDI: Primeira sincronização concluída - ${result.totalProcessed} pagamentos processados`);
        } catch (error) {
          console.error('❌ SICREDI: Erro na primeira sincronização:', error);
        }
      }, 60000); // 1 minuto
      
    } else {
      console.log('⚠️ SICREDI: Sincronização automática desabilitada (SICREDI_AUTO_SYNC=false)');
    }

  } catch (error) {
    console.error('❌ Erro ao iniciar sincronização da SICREDI:', error);
  }
}

/**
 * Função para parar a sincronização (útil para testes)
 */
export function stopSicrediSync(): void {
  // Esta função seria implementada se mantivermos uma referência global ao serviço
  console.log('🛑 SICREDI: Parando sincronização automática...');
}

// Se este arquivo for executado diretamente
if (require.main === module) {
  startSicrediSync()
    .then(() => {
      console.log('✅ Script de sincronização SICREDI executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script de sincronização SICREDI:', error);
      process.exit(1);
    });
}

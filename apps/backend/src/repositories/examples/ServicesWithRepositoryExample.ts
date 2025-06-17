/**
 * Exemplos de uso dos serviços refatorados com Repository Pattern
 * Demonstra como usar LaboratoryService, CashRegisterService e CounterService
 */

import { LaboratoryService } from "../../services/LaboratoryService";
import { CashRegisterService } from "../../services/CashRegisterService";
import { CounterService } from "../../services/CounterService";
import type { ILaboratory } from "../../interfaces/ILaboratory";
import type { ICashRegister } from "../../interfaces/ICashRegister";

export class ServicesWithRepositoryExample {

  /**
   * Exemplo completo do LaboratoryService refatorado
   */
  async exemploLaboratoryService() {
    const laboratoryService = new LaboratoryService();
    
    try {
      console.log("🧪 Testando LaboratoryService com Repository Pattern");

      // 1. Criar laboratório
      const novoLaboratorio: Omit<ILaboratory, "_id"> = {
        name: "Laboratório Example",
        address: {
          street: "Rua das Lentes",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234567"
        },
        phone: "11999999999",
        email: "contato@lab-example.com",
        contactName: "Dr. João Silva",
        isActive: true
      };

      const laboratorio = await laboratoryService.createLaboratory(novoLaboratorio);
      console.log("✅ Laboratório criado:", laboratorio.name);

      // 2. Buscar laboratórios ativos
      const ativos = await laboratoryService.getActiveLaboratories(1, 10);
      console.log(`✅ Laboratórios ativos: ${ativos.total}`);

      // 3. Pesquisar laboratórios
      const busca = await laboratoryService.searchLaboratories("Example", 1, 10);
      console.log(`✅ Resultados da busca: ${busca.total}`);

      // 4. Buscar por cidade
      const porCidade = await laboratoryService.getLaboratoriesByCity("São Paulo", 1, 10);
      console.log(`✅ Laboratórios em São Paulo: ${porCidade.total}`);

      // 5. Alternar status
      if (laboratorio._id) {
        await laboratoryService.toggleLaboratoryStatus(laboratorio._id);
        console.log("✅ Status do laboratório alterado");
      }

      return {
        success: true,
        laboratorio,
        estatisticas: {
          ativos: ativos.total,
          busca: busca.total,
          porCidade: porCidade.total
        }
      };

    } catch (error) {
      console.error("❌ Erro no LaboratoryService:", error);
      throw error;
    }
  }

  /**
   * Exemplo completo do CashRegisterService refatorado
   */
  async exemploCashRegisterService() {
    const cashRegisterService = new CashRegisterService();
    
    try {
      console.log("💰 Testando CashRegisterService com Repository Pattern");

      // 1. Abrir caixa
      const dadosAbertura = {
        openingBalance: 100.00,
        openedBy: "user123",
        observations: "Abertura de caixa teste"
      };

      const caixaAberto = await cashRegisterService.openRegister(dadosAbertura);
      console.log("✅ Caixa aberto:", caixaAberto._id);

      // 2. Buscar caixa atual
      const caixaAtual = await cashRegisterService.getCurrentRegister();
      console.log("✅ Caixa atual:", caixaAtual.status);

      // 3. Buscar todos os caixas
      const todosCaixas = await cashRegisterService.getAllRegisters(1, 10);
      console.log(`✅ Total de caixas: ${todosCaixas.total}`);

      // 4. Fechar caixa
      if (caixaAberto._id) {
        const dadosFechamento = {
          closingBalance: 150.00,
          closedBy: "user123",
          observations: "Fechamento de caixa teste"
        };

        const caixaFechado = await cashRegisterService.closeRegister(dadosFechamento);
        console.log("✅ Caixa fechado:", caixaFechado.status);

        // 5. Resumo do caixa
        const resumo = await cashRegisterService.getRegisterSummary(caixaFechado._id!);
        console.log("✅ Resumo gerado:", resumo.register.status);
      }

      return {
        success: true,
        caixaAberto,
        estatisticas: {
          totalCaixas: todosCaixas.total,
          totalPages: todosCaixas.totalPages
        }
      };

    } catch (error) {
      console.error("❌ Erro no CashRegisterService:", error);
      throw error;
    }
  }

  /**
   * Exemplo completo do CounterService refatorado
   */
  async exemploCounterService() {
    try {
      console.log("🔢 Testando CounterService com Repository Pattern");

      // 1. Criar contador
      const novoContador = await CounterService.createCounter("teste-counter", 100);
      console.log("✅ Contador criado:", novoContador._id);

      // 2. Verificar se existe
      const existe = await CounterService.exists("teste-counter");
      console.log("✅ Contador existe:", existe);

      // 3. Obter próxima sequência
      const proximaSequencia = await CounterService.getNextSequence("teste-counter");
      console.log("✅ Próxima sequência:", proximaSequencia);

      // 4. Obter sequência atual
      const sequenciaAtual = await CounterService.getCurrentSequence("teste-counter");
      console.log("✅ Sequência atual:", sequenciaAtual);

      // 5. Resetar contador
      const resetou = await CounterService.resetCounter("teste-counter", 200);
      console.log("✅ Contador resetado:", resetou);

      // 6. Listar todos os contadores
      const contadores = await CounterService.findAll();
      console.log(`✅ Total de contadores: ${contadores.length}`);

      // 7. Remover contador de teste
      const removeu = await CounterService.deleteCounter("teste-counter");
      console.log("✅ Contador removido:", removeu);

      return {
        success: true,
        novoContador,
        operacoes: {
          existe,
          proximaSequencia,
          sequenciaAtual,
          resetou,
          totalContadores: contadores.length,
          removeu
        }
      };

    } catch (error) {
      console.error("❌ Erro no CounterService:", error);
      throw error;
    }
  }

  /**
   * Teste completo de todos os serviços
   */
  async exemploCompleto() {
    console.log("🚀 Iniciando teste completo dos serviços refatorados");

    try {
      // Executar todos os exemplos
      const [laboratoryResult, cashRegisterResult, counterResult] = await Promise.all([
        this.exemploLaboratoryService(),
        this.exemploCashRegisterService(),
        this.exemploCounterService()
      ]);

      const resultado = {
        success: true,
        message: "Todos os serviços refatorados funcionam corretamente! ✅",
        results: {
          laboratory: laboratoryResult,
          cashRegister: cashRegisterResult,
          counter: counterResult
        },
        summary: {
          servicosTestados: 3,
          operacoesRealizadas: 15,
          sucessoTotal: true
        }
      };

      console.log("🎉 Refatoração concluída com sucesso!");
      console.log("📊 Resumo:", resultado.summary);

      return resultado;

    } catch (error) {
      console.error("❌ Erro no teste completo:", error);
      throw error;
    }
  }
}

// Função para executar exemplo
export async function testarServicosRefatorados() {
  const exemplo = new ServicesWithRepositoryExample();
  
  try {
    const resultado = await exemplo.exemploCompleto();
    console.log("✅ Teste de serviços refatorados concluído!");
    return resultado;
  } catch (error) {
    console.error("❌ Erro no teste de serviços:", error);
    throw error;
  }
} 
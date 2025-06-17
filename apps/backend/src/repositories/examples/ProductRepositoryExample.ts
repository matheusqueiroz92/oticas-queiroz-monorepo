/**
 * Exemplo de uso do ProductRepository - FINALIZADO ✅
 * 
 * Este exemplo mostra como usar todos os métodos do ProductRepository
 * após a finalização e resolução de todas as incompatibilidades
 */

import { RepositoryFactory } from "../RepositoryFactory";
import type { IProduct } from "../../interfaces/IProduct";

export class ProductRepositoryExample {
  private productRepository = RepositoryFactory.getInstance().getProductRepository();

  /**
   * Exemplo completo de operações com produtos
   */
  async exemploCompleto() {
    try {
      console.log("🎉 ProductRepository - FINALIZADO e Testado ✅");

      // 1. Buscar produtos por tipo
      const lentes = await this.productRepository.findByType("lenses", 1, 10);
      console.log(`✅ Lentes encontradas: ${lentes.total}`);

      // 2. Buscar produtos por marca
      const rayBan = await this.productRepository.findByBrand("Ray-Ban", 1, 10);
      console.log(`✅ Produtos Ray-Ban: ${rayBan.total}`);

      // 3. Pesquisa por termo
      const pesquisa = await this.productRepository.search("óculos", 1, 10);
      console.log(`✅ Produtos encontrados na pesquisa: ${pesquisa.total}`);

      // 4. Produtos com estoque baixo
      const estoqueBaixo = await this.productRepository.findLowStock(5, 1, 10);
      console.log(`✅ Produtos com estoque baixo: ${estoqueBaixo.total}`);

      // 5. Produtos sem estoque
      const semEstoque = await this.productRepository.findOutOfStock(1, 10);
      console.log(`✅ Produtos sem estoque: ${semEstoque.total}`);

      // 6. Buscar por faixa de preço
      const porPreco = await this.productRepository.findByPriceRange(100, 500, 1, 10);
      console.log(`✅ Produtos R$ 100-500: ${porPreco.total}`);

      // 7. Lentes por tipo específico
      const lentesProgressivas = await this.productRepository.findLensesByType("progressive", 1, 10);
      console.log(`✅ Lentes progressivas: ${lentesProgressivas.total}`);

      // 8. Armações com filtros específicos
      const armacoes = await this.productRepository.findFramesByFilters({
        color: "black",
        shape: "round"
      }, 1, 10);
      console.log(`✅ Armações pretas redondas: ${armacoes.total}`);

      // 9. Estatísticas completas
      const stats = await this.productRepository.getProductStats();
      console.log("✅ Estatísticas:", {
        total: stats.totalProducts,
        valorEstoque: stats.totalStockValue,
        estoqueBaixo: stats.lowStockProducts,
        semEstoque: stats.outOfStockProducts
      });

      // 10. Valor total do estoque
      const valorTotal = await this.productRepository.calculateStockValue();
      console.log(`✅ Valor total do estoque: R$ ${valorTotal.toFixed(2)}`);

      return {
        message: "ProductRepository finalizado com sucesso! ✅",
        success: true,
        exemplos: {
          lentes: lentes.total,
          rayBan: rayBan.total,
          pesquisa: pesquisa.total,
          estoqueBaixo: estoqueBaixo.total,
          semEstoque: semEstoque.total,
          porPreco: porPreco.total,
          lentesProgressivas: lentesProgressivas.total,
          armacoes: armacoes.total,
          valorEstoque: valorTotal
        }
      };

    } catch (error) {
      console.error("❌ Erro no exemplo:", error);
      throw error;
    }
  }

  /**
   * Exemplo de operações de estoque
   */
  async exemploOperacoesEstoque(productId: string) {
    try {
      // Buscar produto original
      const produto = await this.productRepository.findById(productId);
      if (!produto) {
        throw new Error("Produto não encontrado");
      }

      console.log(`📦 Produto original: ${produto.name} - Estoque: ${produto.stock}`);

      // Aumentar estoque
      await this.productRepository.increaseStock(productId, 10);
      console.log("✅ Estoque aumentado em 10 unidades");

      // Diminuir estoque
      await this.productRepository.decreaseStock(productId, 5);
      console.log("✅ Estoque diminuído em 5 unidades");

      // Atualizar preço de venda
      await this.productRepository.updateSellPrice(productId, 299.99);
      console.log("✅ Preço de venda atualizado para R$ 299,99");

      // Atualizar preço de custo
      await this.productRepository.updateCostPrice(productId, 150.00);
      console.log("✅ Preço de custo atualizado para R$ 150,00");

      // Buscar produto atualizado
      const produtoAtualizado = await this.productRepository.findById(productId);
      console.log(`📦 Produto atualizado: Estoque: ${produtoAtualizado?.stock}, Preço: R$ ${produtoAtualizado?.sellPrice}`);

      return { success: true, produto: produtoAtualizado };

    } catch (error) {
      console.error("❌ Erro nas operações de estoque:", error);
      throw error;
    }
  }

  /**
   * Exemplo de análise de vendas
   */
  async exemploAnaliseVendas() {
    try {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      // Produtos mais vendidos
      const maisVendidos = await this.productRepository.findBestSelling(startDate, endDate, 5);
      console.log("🏆 Top 5 produtos mais vendidos:");
      maisVendidos.forEach((item: { product: IProduct; totalSold: number }, index: number) => {
        console.log(`${index + 1}. ${item.product.name} - ${item.totalSold} unidades`);
      });

      // Produtos deletados (para auditoria)
      const deletados = await this.productRepository.findDeleted(1, 10);
      console.log(`🗑️ Produtos deletados: ${deletados.total}`);

      // Filtros avançados
      const filtrosAvancados = await this.productRepository.findWithFilters({
        sellPrice: { $gte: 200, $lte: 500 },
        stock: { $gt: 0 },
        productType: "prescription_frame"
      }, 1, 10);
      console.log(`🔍 Armações de R$ 200-500 em estoque: ${filtrosAvancados.total}`);

      return {
        maisVendidos: maisVendidos.length,
        deletados: deletados.total,
        filtrosAvancados: filtrosAvancados.total
      };

    } catch (error) {
      console.error("❌ Erro na análise de vendas:", error);
      throw error;
    }
  }
}

// Exemplo de uso
export async function testarProductRepository() {
  const exemplo = new ProductRepositoryExample();
  
  try {
    // Teste completo
    const resultado = await exemplo.exemploCompleto();
    console.log("🎉 ProductRepository finalizado com sucesso!");
    console.log(resultado);
    
    return resultado;
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    throw error;
  }
} 
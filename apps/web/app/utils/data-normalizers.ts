/**
 * Utilitários para normalização de dados vindos da API,
 * garantindo consistência entre ambientes
 */

import type { Order } from "@/app/types/order";
import type { Product } from "@/app/types/product";
import { diagnosticLog } from "./env-utils";

/**
 * Extrai o ID de uma entidade que pode vir em diferentes formatos
 */
export function extractId(entity: any): string | null {
  try {
    // Se for objeto com propriedade _id
    if (entity && typeof entity === 'object' && entity._id) {
      return entity._id;
    }

    // Se for uma string de ID direto
    if (typeof entity === 'string' && !entity.includes('{') && !entity.includes(':')) {
      return entity;
    }

    // Se for uma string contendo objeto serializado
    if (typeof entity === 'string' && entity.includes('_id:')) {
      const idMatch = entity.match(/_id:\s*['"]([^'"]+)['"]/);
      if (idMatch && idMatch[1]) {
        return idMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao extrair ID:", error);
    return null;
  }
}

/**
 * Extrai o nome de uma entidade que pode vir em diferentes formatos
 */
export function extractName(entity: any): string {
  try {
    // Se for objeto com propriedade name
    if (entity && typeof entity === 'object' && entity.name) {
      return entity.name;
    }

    // Se for uma string que contém objeto JSON stringificado
    if (typeof entity === 'string') {
      // Tentar interpretar como um objeto JSON
      try {
        if (entity.includes('{') && entity.includes('name')) {
          // Formato: { _id: new ObjectId('id'), name: 'Nome', ... }
          // Usando regex para extrair entre aspas simples ou duplas
          const nameMatch = entity.match(/name:\s*['"](.*?)['"]/);
          if (nameMatch && nameMatch[1]) {
            return nameMatch[1];
          }
          
          // Outro padrão comum: name: Nome sem aspas (caso específico)
          const altNameMatch = entity.match(/name:\s*([^,}]+)/);
          if (altNameMatch && altNameMatch[1]) {
            return altNameMatch[1].trim();
          }
        }
      } catch (e) {
        console.error("Erro ao processar string como objeto:", e);
      }
      
      // Se não encontrou com regex, tenta uma abordagem alternativa
      if (entity.includes('_id:') && entity.includes('name:')) {
        console.log("Tentando extrair nome de:", entity);
        // Para debug: log detalhado do formato encontrado
        diagnosticLog("Formato de entidade:", entity);
        
        // Expressão para capturar o nome entre aspas ou até a próxima vírgula/chave
        const nameRegex = /name:\s*(?:['"]([^'"]+)['"]|([^,}]+))/;
        const match = entity.match(nameRegex);
        
        if (match) {
          const name = match[1] || match[2]; // Captura com ou sem aspas
          return name ? name.trim() : "Nome não encontrado";
        }
      }
    }

    // Se chegou até aqui, não conseguiu extrair
    return "Nome não disponível";
  } catch (error) {
    console.error("Erro ao extrair nome:", error);
    return "Nome não disponível";
  }
}

/**
 * Extrair nome de strings no formato específico da produção
 * Ex: { _id: new ObjectId('67d80ad0e8da2262999fba58'), name: 'Alan Queiroz', ... }
 */
export function extractNameFromString(str: string): string {
  try {
    // Caso específico para o formato que você está recebendo
    if (typeof str === 'string' && str.includes('ObjectId') && str.includes('name:')) {
      // Para extrair nomes entre aspas simples
      const singleQuoteMatch = str.match(/name:\s*'([^']+)'/);
      if (singleQuoteMatch && singleQuoteMatch[1]) {
        return singleQuoteMatch[1];
      }
      
      // Para extrair nomes entre aspas duplas
      const doubleQuoteMatch = str.match(/name:\s*"([^"]+)"/);
      if (doubleQuoteMatch && doubleQuoteMatch[1]) {
        return doubleQuoteMatch[1];
      }
      
      // Para extrair nomes sem aspas
      const noQuotesMatch = str.match(/name:\s*([^,}]+)/);
      if (noQuotesMatch && noQuotesMatch[1]) {
        return noQuotesMatch[1].trim();
      }
    }
    
    return "Nome não disponível";
  } catch (error) {
    console.error("Erro ao extrair nome de string:", error);
    return "Nome não disponível";
  }
}

/**
 * Extrai o email de uma entidade que pode vir em diferentes formatos
 */
export function extractEmail(entity: any): string | null {
  try {
    // Se for objeto com propriedade email
    if (entity && typeof entity === 'object' && entity.email) {
      return entity.email;
    }

    // Se for uma string contendo objeto serializado
    if (typeof entity === 'string' && entity.includes('email:')) {
      const emailMatch = entity.match(/email:\s*['"]([^'"]+)['"]/);
      if (emailMatch && emailMatch[1]) {
        return emailMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao extrair email:", error);
    return null;
  }
}

/**
 * Normaliza um produto que pode vir em diferentes formatos
 * Versão corrigida para lidar melhor com campos ausentes e garantir valores padrão adequados
 */
export function normalizeProduct(product: any): Product {
  if (!product) {
    return {
      _id: '',
      name: 'Produto desconhecido',
      productType: 'lenses', // Usando um tipo válido como padrão
      description: '',
      sellPrice: 0
    } as Product;
  }

  // Se for string, tentar parsear como objeto ou extrair informações
  if (typeof product === 'string') {
    // Tentativa de extrair informações com regex mais robustos
    const idPattern = /_id[\s:]?\s*(?:(?:ObjectId\(['"]([^'"]+)['"]\))|['"]([^'"]+)['"]|([^,}\s]+))/i;
    const idMatch = product.match(idPattern);
    const id = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : '';
    
    // Extrair nome com padrão mais abrangente
    const namePattern = /name[\s:]?\s*(?:['"]([^'"]+)['"]|([^,}\s]+))/i;
    const nameMatch = product.match(namePattern);
    const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Produto desconhecido';
    
    // Extrair tipo com validação
    const typePattern = /productType[\s:]?\s*(?:['"]([^'"]+)['"]|([^,}\s]+))/i;
    const typeMatch = product.match(typePattern);
    let type = typeMatch ? (typeMatch[1] || typeMatch[2]) : '';
    
    // Garantir que o tipo seja válido
    const validTypes = ['lenses', 'clean_lenses', 'prescription_frame', 'sunglasses_frame'];
    if (!validTypes.includes(type)) {
      type = 'lenses'; // Valor padrão seguro
    }
    
    // Extrair preço com melhor detecção
    // Primeiro tenta buscar um padrão sellPrice: 123
    const pricePattern = /sellPrice[\s:]?\s*([\d.]+)/i;
    const priceMatch = product.match(pricePattern);
    
    // Se não encontrar, tenta buscar diretamente o número
    let price = 0;
    if (priceMatch && priceMatch[1]) {
      price = parseFloat(priceMatch[1]);
    } else {
      // Busca qualquer número no texto para o caso do formato variar
      const numberPattern = /(\d+(?:\.\d+)?)/g;
      const numbers = product.match(numberPattern);
      if (numbers && numbers.length > 0) {
        // Assumimos que o primeiro número significativo é o preço
        // Filtramos apenas números com valor significativo (maiores que 0)
        const significantNumbers = numbers
          .map(n => parseFloat(n))
          .filter(n => !isNaN(n) && n > 0);
        
        if (significantNumbers.length > 0) {
          price = significantNumbers[0];
        }
      }
    }
    
    return {
      _id: id,
      name: name,
      productType: type as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame",
      description: '',
      sellPrice: price
    } as Product;
  }
  
  // Se já for um objeto
  if (typeof product === 'object' && product !== null) {
    // Determina o tipo do produto - verifica se o tipo está entre os valores válidos
    const validTypes = ['lenses', 'clean_lenses', 'prescription_frame', 'sunglasses_frame'];
    let productType = product.productType || 'lenses'; // Valor padrão seguro
    
    // Se o tipo não for válido, tenta inferir com base em outros campos
    if (!validTypes.includes(productType)) {
      if (product.lensType) {
        productType = 'lenses';
      } else if (product.typeFrame && product.modelSunglasses) {
        productType = 'sunglasses_frame';
      } else if (product.typeFrame) {
        productType = 'prescription_frame';
      } else {
        productType = 'lenses'; // Valor padrão seguro
      }
    }
    
    // Garante que o preço seja um número válido
    let sellPrice = 0;
    if (typeof product.sellPrice === 'number' && !isNaN(product.sellPrice)) {
      sellPrice = product.sellPrice;
    } else if (typeof product.sellPrice === 'string' && product.sellPrice.trim() !== '') {
      const parsed = parseFloat(product.sellPrice.replace(/[^\d.-]/g, ''));
      sellPrice = !isNaN(parsed) ? parsed : 0;
    }
    
    // Para casos onde o API retorna cost_price em vez de costPrice
    const costPrice = typeof product.costPrice === 'number' 
      ? product.costPrice 
      : (typeof product.cost_price === 'number' 
          ? product.cost_price 
          : 0);
    
    // Cria um novo objeto com os campos básicos
    const result = {
      _id: product._id || '',
      name: product.name || 'Produto sem nome',
      description: product.description || '',
      brand: product.brand || '',
      costPrice: costPrice,
      // Usar campos normalizados
      productType: productType as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame",
      sellPrice: sellPrice
    };
    
    // Adiciona outros campos extras do objeto original
    for (const key in product) {
      if (
        key !== '_id' && 
        key !== 'name' && 
        key !== 'description' && 
        key !== 'brand' && 
        key !== 'productType' && 
        key !== 'sellPrice' && 
        key !== 'costPrice'
      ) {
        // @ts-ignore - Adicionando propriedades dinâmicas
        result[key] = product[key];
      }
    }
    
    return result as Product;
  }
  
  return {
    _id: '',
    name: 'Produto desconhecido',
    productType: 'lenses', // Valor padrão seguro
    description: '',
    sellPrice: 0
  } as Product;
}

/**
 * Normaliza um array de produtos
 */
export function normalizeProducts(products: any[] | any): Product[] {
  // Se não for um array, converter para array com um único item
  if (!Array.isArray(products)) {
    return [normalizeProduct(products)];
  }

  // Normalizar cada item do array
  return products.map(product => normalizeProduct(product));
}

/**
 * Normaliza um pedido completo
 */
export function normalizeOrder(order: any): Order {
  if (!order) return {} as Order;
  
  try {
    // Extrair nomes diretamente, utilizando a função especializada para strings
    const clientName = typeof order.clientId === 'string' 
      ? extractNameFromString(order.clientId)
      : (order.clientId && order.clientId.name) 
        ? order.clientId.name 
        : "Nome não disponível";
        
    const employeeName = typeof order.employeeId === 'string'
      ? extractNameFromString(order.employeeId)
      : (order.employeeId && order.employeeId.name)
        ? order.employeeId.name
        : "Nome não disponível";
    
    // Normalizar produtos (pode ser array ou objeto único)
    const normalizedProducts = normalizeProducts(order.product);
    
    // Garantir que todos os campos existam e estejam em formato adequado
    return {
      _id: order._id || "",
      clientId: order.clientId || "",
      employeeId: order.employeeId || "",
      product: normalizedProducts,
      paymentMethod: order.paymentMethod || "",
      paymentEntry: order.paymentEntry || 0,
      installments: order.installments || 0,
      orderDate: order.orderDate || new Date().toISOString(),
      deliveryDate: order.deliveryDate || "",
      status: order.status || "pending",
      laboratoryId: order.laboratoryId || null,
      prescriptionData: order.prescriptionData || null,
      observations: order.observations || "",
      totalPrice: order.totalPrice || 0,
      discount: order.discount || 0,
      finalPrice: order.finalPrice || order.totalPrice || 0,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString(),

      // Dados normalizados adicionais para uso no frontend
      _normalized: {
        clientName,
        clientId: extractId(order.clientId),
        employeeName,
        employeeId: extractId(order.employeeId),
        laboratoryName: order.laboratoryId ? 
          (typeof order.laboratoryId === 'string' 
            ? extractNameFromString(order.laboratoryId) 
            : (order.laboratoryId && order.laboratoryId.name 
                ? order.laboratoryId.name 
                : null)) 
          : null,
      }
    } as Order;
  } catch (error) {
    console.error("Erro ao normalizar pedido:", error);
    return {
      _id: order._id || "",
      clientId: "",
      employeeId: "",
      product: [],
      paymentMethod: "",
      status: "pending",
      totalPrice: 0,
      discount: 0,
      finalPrice: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _normalized: {
        clientName: "Erro ao processar cliente",
        clientId: null,
        employeeName: "Erro ao processar vendedor",
        employeeId: null,
        laboratoryName: null,
      }
    } as unknown as Order;
  }
}

/**
 * Normaliza uma lista de pedidos
 */
export function normalizeOrders(orders: any[]): Order[] {
  if (!Array.isArray(orders)) return [];
  return orders.map(order => normalizeOrder(order));
}
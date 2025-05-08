import { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/OrderModel';
import { UserModel } from '../models/UserModel';

const orderModel = new OrderModel();
const userModel = new UserModel();

export const validateAndUpdateRelationships = async (req: Request, res: Response, next: NextFunction) => {
  const originalMethod = res.json;
  
  res.json = function(data) {
    // Se a resposta contiver um pedido e for bem-sucedida
    if (data && (data._id || data.orders)) {
      // Para uma lista de pedidos
      if (data.orders) {
        // Não precisamos fazer nada aqui, pois a operação em lote já é tratada no serviço
      } 
      // Para um único pedido
      else if (data._id) {
        // Garantir que o pedido tenha os relacionamentos corretos
        setTimeout(async () => {
          try {
            const order = data;
            
            if (order.employeeId && order.clientId && order._id) {
              // Atualizar vendas do funcionário
              const employee = await userModel.findById(order.employeeId.toString());
              if (employee) {
                const sales = employee.sales || [];
                const salesSet = new Set(sales.map(id => id.toString()));
                
                if (!salesSet.has(order._id.toString())) {
                  salesSet.add(order._id.toString());
                  await userModel.update(order.employeeId.toString(), {
                    sales: Array.from(salesSet)
                  });
                }
              }
              
              // Atualizar compras do cliente
              const client = await userModel.findById(order.clientId.toString());
              if (client) {
                const purchases = client.purchases || [];
                const purchasesSet = new Set(purchases.map(id => id.toString()));
                
                if (!purchasesSet.has(order._id.toString())) {
                  purchasesSet.add(order._id.toString());
                  await userModel.update(order.clientId.toString(), {
                    purchases: Array.from(purchasesSet)
                  });
                }
              }
              
              // Atualizar dívida do cliente se for pagamento parcelado
              if (order.paymentMethod === 'bank_slip' || order.paymentMethod === 'promissory_note') {
                if (client) {
                  const debtAmount = order.finalPrice - (order.paymentEntry || 0);
                  if (debtAmount > 0) {
                    const currentDebt = client.debts || 0;
                    await userModel.update(order.clientId.toString(), {
                      debts: currentDebt + debtAmount
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro no middleware de relacionamentos:', error);
          }
        }, 0);
      }
    }
    
    return originalMethod.call(this, data);
  };
  
  next();
};
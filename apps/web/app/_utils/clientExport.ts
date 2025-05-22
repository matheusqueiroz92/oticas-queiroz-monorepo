import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import type { Order } from '@/app/_types/order';
import { formatCurrency } from './formatters';

/**
 * Formata a lista de produtos para exibição
 */
const formatProducts = (products: any[]): string => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return "Nenhum produto";
  }

  return products.map(product => {
    if (typeof product === 'string') {
      return `ID: ${product}`;
    }
    
    // Para objetos com detalhes do produto
    const name = product.name || "Sem nome";
    const price = product.sellPrice ? `R$ ${product.sellPrice.toFixed(2)}` : "Preço não definido";
    return `${name} (${price})`;
  }).join("; ");
};

/**
 * Exporta os pedidos para Excel
 */
export const exportOrdersToExcel = (
  orders: Order[], 
  title: string,
  getClientName: (id: string) => string,
  getEmployeeName: (id: string) => string,
  getOrderStatus: (status: string) => { label: string; className: string }
): void => {
  // Preparar dados para Excel
  const data = orders.map(order => ({
    'ID': order._id || '',
    'O.S.': order.serviceOrder ? order.serviceOrder : '',
    'Cliente': getClientName(order.clientId),
    'Funcionário': getEmployeeName(order.employeeId),
    'Produtos': formatProducts(order.products || []),
    'Status': getOrderStatus(order.status).label,
    'Método de Pagamento': order.paymentMethod,
    'Valor Total': order.totalPrice,
    'Desconto': order.discount || 0,
    'Valor Final': order.finalPrice,
    'Data do Pedido': new Date(order.orderDate ?? order.createdAt ?? '').toLocaleDateString(),
    'Data de Entrega': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'
  }));

  // Criar planilha
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

  // Adicionar título
  XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
  
  // Ajustar largura das colunas
  const colWidths = [{ wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, 
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
worksheet['!cols'] = colWidths;

  // Formatar valores monetários
  // const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  
  // Buscar células monetárias e aplicar formato
  for (let i = 0; i < data.length; i++) {
    const row = i + 2; // +2 por causa do título e cabeçalho
    worksheet[`G${row}`] = { v: data[i]['Valor Total'], w: formatCurrency(data[i]['Valor Total']) };
    worksheet[`H${row}`] = { v: data[i]['Desconto'], w: formatCurrency(data[i]['Desconto']) };
    worksheet[`I${row}`] = { v: data[i]['Valor Final'], w: formatCurrency(data[i]['Valor Final']) };
  }

  // Exportar arquivo
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `pedidos-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Exporta os pedidos para PDF
 */
export const exportOrdersToPDF = (
  orders: Order[], 
  title: string,
  getClientName: (id: string) => string,
  getEmployeeName: (id: string) => string,
  getOrderStatus: (status: string) => { label: string; className: string }
): void => {
  // Carregar jsPDF com autoTable
  import('jspdf-autotable').then(x => {
    // Criar documento PDF
    const doc = new jsPDF();
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Adicionar data de geração
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);
    
    // Preparar dados para tabela
    const tableColumn = ["O.S.", "Cliente", "Produtos", "Valor Final", "Data do pedido"];
    const tableRows = orders.map(order => [
      // order._id?.toString().substring(0, 10) + "..." || "",
      order.serviceOrder || "",
      getClientName(order.clientId) || "",
      // getEmployeeName(order.employeeId) || "",
      formatProducts(order.products) || "",
      // getOrderStatus(order.status).label || "",
      // `R$ ${order.totalPrice?.toFixed(2) || "0.00"}`,
      // `R$ ${order.discount?.toFixed(2) || "0.00"}`,
      `R$ ${order.finalPrice?.toFixed(2) || "0.00"}`,
      new Date(order.orderDate ?? order.createdAt ?? '').toLocaleDateString() || "",
      // new Date(order.deliveryDate ?? '').toLocaleDateString() || ""
    ]);
    
    // Usar autoTable
    const { default: autoTable } = x;
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Salvar o PDF
    doc.save(`pedidos-${new Date().toISOString().split('T')[0]}.pdf`);
  });
};

/**
 * Exporta os pedidos para CSV
 */
export const exportOrdersToCSV = (
  orders: Order[], 
  getClientName: (id: string) => string,
  getEmployeeName: (id: string) => string,
  getOrderStatus: (status: string) => { label: string; className: string }
): void => {
  // Preparar dados
  const data = orders.map(order => ({
    'ID': order._id || '',
    'O.S.': order.serviceOrder ? order.serviceOrder : '',
    'Cliente': getClientName(order.clientId),
    'Funcionário': getEmployeeName(order.employeeId),
    'Produtos': formatProducts(order.products || []),
    'Status': getOrderStatus(order.status).label,
    'Método de Pagamento': order.paymentMethod,
    'Valor Total': `R$ ${order.totalPrice.toFixed(2)}`,
    'Desconto': `R$ ${(order.discount || 0).toFixed(2)}`,
    'Valor Final': `R$ ${order.finalPrice.toFixed(2)}`,
    'Data do Pedido': new Date(order.orderDate ?? order.createdAt ?? '').toLocaleDateString(),
    'Data de Entrega': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'
  }));
  
  // Obter cabeçalhos
  const headers = Object.keys(data[0] || {});
  
  // Criar linhas CSV
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  // Adicionar dados
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = String((row as Record<string, string>)[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Criar blob e baixar
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `pedidos-${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Exporta os pedidos para JSON
 */
export const exportOrdersToJSON = (orders: Order[]): void => {
  // Simplificar dados para JSON
  const data = orders.map(order => ({
        id: order._id,
        clientId: order.clientId,
        employeeId: order.employeeId,
        products: order.products,
        serviceOrder: order.serviceOrder,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        discount: order.discount,
        finalPrice: order.finalPrice,
        orderDate: order.orderDate || order.createdAt,
        deliveryDate: order.deliveryDate
      }));
  
  // Criar blob e baixar
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  saveAs(blob, `pedidos-${new Date().toISOString().split('T')[0]}.json`);
};
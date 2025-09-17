import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import type { Order } from '@/app/_types/order';
import { formatCurrency } from './formatters';
import 'jspdf-autotable';

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
  getEmployeeName: (order: Order) => string,
  getOrderStatus: (status: string) => { label: string; className: string }
): void => {
  // Preparar dados para Excel
  const data = orders.map(order => ({
    'ID': order._id || '',
    'O.S.': order.serviceOrder ? order.serviceOrder : '',
    'Cliente': getClientName(order.clientId),
    'Funcionário': getEmployeeName(order),
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
  // getEmployeeName: (order: Order) => string,
  // getOrderStatus: (status: string) => { label: string; className: string }
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
  getEmployeeName: (order: Order) => string,
  getOrderStatus: (status: string) => { label: string; className: string }
): void => {
  // Preparar dados
  const data = orders.map(order => ({
    'ID': order._id || '',
    'O.S.': order.serviceOrder ? order.serviceOrder : '',
    'Cliente': getClientName(order.clientId),
    'Funcionário': getEmployeeName(order),
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

interface ExportCustomerOptions {
  data: any[];
  format: 'excel' | 'pdf' | 'csv' | 'json';
  title: string;
  filename: string;
}

/**
 * Exporta dados de clientes em diferentes formatos
 */
export const exportCustomers = async (options: ExportCustomerOptions): Promise<Blob> => {
  const { data, format, title } = options;

  switch (format) {
    case 'excel':
      return exportToExcel(data);
    case 'csv':
      return exportToCSV(data);
    case 'pdf':
      return await exportToPDF(data, title);
    case 'json':
      return exportToJSON(data);
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
};

/**
 * Exporta para Excel
 */
const exportToExcel = (data: any[]): Blob => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  
  // Ajustar largura das colunas
  const wscols = [
    { wch: 25 }, // Nome
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 15 }, // CPF
    { wch: 15 }, // Data de Nascimento
    { wch: 30 }, // Endereço
    { wch: 15 }, // Cidade
    { wch: 10 }, // Estado
    { wch: 10 }, // CEP
    { wch: 15 }, // Tipo de Cliente
    { wch: 10 }, // Status
    { wch: 15 }, // Total de Compras
    { wch: 15 }, // Débitos
    { wch: 15 }, // Data de Cadastro
    { wch: 15 }, // Última Atualização
  ];
  ws['!cols'] = wscols;

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Exporta para CSV
 */
const exportToCSV = (data: any[]): Blob => {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header] || '';
      // Escapar aspas duplas e envolver em aspas se contém vírgula
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(','))
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

/**
 * Exporta para PDF
 */
const exportToPDF = async (data: any[], title: string): Promise<Blob> => {
  // Importar jsPDF com autoTable dinamicamente
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Título
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25);

  // Preparar dados para a tabela
  const headers = Object.keys(data[0] || {});
  const rows = data.map(item => headers.map(header => String(item[header] || '')));

  // Adicionar tabela usando autoTable importado
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 35, left: 14, right: 14 },
    tableWidth: 'auto',
    columnStyles: {
      0: { cellWidth: 25 }, // Nome
      1: { cellWidth: 30 }, // Email
      2: { cellWidth: 15 }, // Telefone
      3: { cellWidth: 15 }, // CPF
    }
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

/**
 * Exporta para JSON
 */
const exportToJSON = (data: any[]): Blob => {
  const jsonContent = JSON.stringify(data, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
};
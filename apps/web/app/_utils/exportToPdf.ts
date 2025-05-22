import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportToPDFOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
}

export async function exportToPDF(
  data: Record<string, any>[],
  filename: string = 'exportacao.pdf',
  documentTitle: string = 'Relatório',
  options: ExportToPDFOptions = {}
) {
  try {
    // Configurações padrão
    const {
      orientation = 'landscape',
      pageSize = 'a4',
      title = documentTitle,
      subtitle = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
    } = options;

    // Criar novo documento PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    }) as any; // usando any para acessar autoTable

    // Configurar fonte e tamanho
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);

    // Título
    doc.text(title, 14, 22);
    
    // Subtítulo
    doc.setFontSize(10);
    doc.text(subtitle, 14, 30);

    // Se não há dados, exibir mensagem
    if (!data.length) {
      doc.text('Não há dados para exportar.', 14, 40);
      doc.save(filename);
      return;
    }

    // Obter cabeçalhos das colunas (baseado no primeiro objeto)
    const headers = Object.keys(data[0]);

    // Formatar cabeçalhos para apresentação
    const formattedHeaders = headers.map(header => {
      // Converter camelCase para Title Case e remover underlines
      const formatted = header
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    });

    // Preparar dados para a tabela
    const tableData = data.map(row => 
      headers.map(header => row[header] !== undefined ? row[header] : '')
    );

    // Gerar a tabela automática
    doc.autoTable({
      head: [formattedHeaders],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 126],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 245],
      },
      margin: { top: 40 },
    });

    // Adicionar paginação
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 20, 
        doc.internal.pageSize.height - 10
      );
    }

    // Salvar o arquivo
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
}
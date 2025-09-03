import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportData {
  totalSuppliers: number;
  totalStores: number;
  openTickets: number;
  resolvedTickets: number;
  completedInstallations: number;
  nonCompletedStores: number;
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Relatório Gerencial', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${currentDate}`, 105, 30, { align: 'center' });

  // Company/System Info
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Sistema de Gestão de Franquias', 105, 45, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);

  // Metrics Summary Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumo dos Indicadores', 20, 70);

  // Create metrics table data
  const metricsData = [
    ['Indicador', 'Valor', 'Status'],
    ['Total de Lojas', data.totalStores.toString(), 'Base cadastrada'],
    ['Total de Fornecedores', data.totalSuppliers.toString(), 'Parceiros ativos'],
    ['Chamados em Aberto', data.openTickets.toString(), data.openTickets > 0 ? 'Requer atenção' : 'Ok'],
    ['Chamados Resolvidos', data.resolvedTickets.toString(), 'Finalizados'],
    ['Lojas Finalizadas', data.completedInstallations.toString(), 'Instalações completas'],
    ['Lojas Não Finalizadas', data.nonCompletedStores.toString(), 'Em processo']
  ];

  // Add metrics table
  autoTable(doc, {
    startY: 80,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 11
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // Performance Analysis
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Análise de Performance', 20, finalY + 20);

  // Calculate completion rate
  const completionRate = data.totalStores > 0 
    ? Math.round((data.completedInstallations / data.totalStores) * 100) 
    : 0;
  
  const performanceData = [
    ['Métrica', 'Valor', 'Observação'],
    ['Taxa de Conclusão', `${completionRate}%`, completionRate >= 70 ? 'Bom desempenho' : 'Necessita atenção'],
    ['Chamados Pendentes', data.openTickets.toString(), data.openTickets > 5 ? 'Alto volume' : 'Volume normal'],
    ['Eficiência Operacional', `${100 - Math.round((data.openTickets / (data.openTickets + data.resolvedTickets)) * 100)}%`, 'Taxa de resolução']
  ];

  autoTable(doc, {
    startY: finalY + 30,
    head: [performanceData[0]],
    body: performanceData.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: [92, 184, 92],
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 11
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
  }

  // Save the PDF
  doc.save(`relatorio_gerencial_${new Date().getTime()}.pdf`);
};

export const generateExcelReport = (data: ReportData) => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Main metrics sheet
  const metricsData = [
    ['RELATÓRIO GERENCIAL - SISTEMA DE GESTÃO DE FRANQUIAS'],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`],
    [],
    ['RESUMO DOS INDICADORES'],
    [],
    ['Indicador', 'Valor', 'Status', 'Observações'],
    ['Total de Lojas', data.totalStores, 'Base cadastrada', 'Total de lojas cadastradas no sistema'],
    ['Total de Fornecedores', data.totalSuppliers, 'Parceiros ativos', 'Fornecedores disponíveis para instalação'],
    ['Chamados em Aberto', data.openTickets, data.openTickets > 0 ? 'Requer atenção' : 'Ok', 'Chamados aguardando resolução'],
    ['Chamados Resolvidos', data.resolvedTickets, 'Finalizados', 'Chamados concluídos com sucesso'],
    ['Lojas Finalizadas', data.completedInstallations, 'Instalações completas', 'Lojas com instalação finalizada'],
    ['Lojas Não Finalizadas', data.nonCompletedStores, 'Em processo', 'Lojas aguardando finalização'],
    [],
    ['ANÁLISE DE PERFORMANCE'],
    [],
    ['Métrica', 'Valor', 'Análise']
  ];

  // Calculate performance metrics
  const completionRate = data.totalStores > 0 
    ? Math.round((data.completedInstallations / data.totalStores) * 100) 
    : 0;
  
  const resolutionRate = (data.openTickets + data.resolvedTickets) > 0
    ? Math.round((data.resolvedTickets / (data.openTickets + data.resolvedTickets)) * 100)
    : 0;

  metricsData.push(
    ['Taxa de Conclusão', `${completionRate}%`, completionRate >= 70 ? 'Bom desempenho' : 'Necessita melhorias'],
    ['Taxa de Resolução de Chamados', `${resolutionRate}%`, resolutionRate >= 80 ? 'Excelente' : 'Pode melhorar'],
    ['Lojas Pendentes', data.nonCompletedStores, data.nonCompletedStores > 50 ? 'Volume alto' : 'Volume controlado'],
    ['Chamados Pendentes', data.openTickets, data.openTickets > 5 ? 'Priorizar resolução' : 'Volume normal']
  );

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(metricsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 },  // Column A
    { wch: 20 },  // Column B
    { wch: 25 },  // Column C
    { wch: 40 }   // Column D
  ];

  // Merge cells for headers
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },  // Date
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },  // Section header
    { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } }  // Performance header
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório Geral');

  // Create detailed metrics sheet
  const detailData = [
    ['DADOS DETALHADOS'],
    [],
    ['Categoria', 'Total', 'Finalizados', 'Pendentes', 'Taxa de Conclusão'],
    ['Lojas', data.totalStores, data.completedInstallations, data.nonCompletedStores, `${completionRate}%`],
    ['Chamados', data.openTickets + data.resolvedTickets, data.resolvedTickets, data.openTickets, `${resolutionRate}%`],
    [],
    ['RESUMO EXECUTIVO'],
    [],
    [`Total de ${data.totalStores} lojas cadastradas no sistema`],
    [`${data.completedInstallations} lojas com instalação finalizada (${completionRate}% de conclusão)`],
    [`${data.nonCompletedStores} lojas aguardando finalização da instalação`],
    [`${data.totalSuppliers} fornecedores ativos disponíveis`],
    [`${data.openTickets} chamados aguardando resolução`],
    [`${data.resolvedTickets} chamados resolvidos com sucesso`]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(detailData);
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 }
  ];
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Análise Detalhada');

  // Generate and save file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `relatorio_gerencial_${new Date().getTime()}.xlsx`);
};
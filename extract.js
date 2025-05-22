window.generateExtract = function(extractData, callback) {
  console.log('Gerando extrato PDF:', extractData.title);
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Carregar o logotipo
    const img = new Image();
    img.src = 'NAVIX.png';
    img.onload = function() {
      try {
        // Cabeçalho
        doc.setFontSize(18);
        doc.setTextColor(0, 102, 204); // Cor azul do NAVIX
        doc.text('NAVIX - Sistema de Gestão de Equipamentos', 105, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(extractData.title, 105, 25, { align: 'center' });
        doc.addImage(img, 'PNG', 10, 10, 20, 20);

        // Informações adicionais
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 35);
        doc.text(`Usuário: ${localStorage.getItem('userName') || 'Desconhecido'} (${localStorage.getItem('userType') || 'N/A'})`, 10, 40);

        // Tabela de eventos
        doc.autoTable({
          startY: 50,
          head: [extractData.headers],
          body: extractData.data,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [0, 102, 204], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 30 }, // Equipamento
            1: { cellWidth: 30 }, // Data/Hora
            2: { cellWidth: 20 }, // Status
            3: { cellWidth: 60 }, // Detalhes
            4: { cellWidth: 30 }  // Responsável
          },
          margin: { top: 50, left: 10, right: 10 }
        });

        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
        }

        // Salvar o PDF
        doc.save(`${extractData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/[^0-9]/g, '')}.pdf`);
        console.log('PDF gerado com sucesso:', extractData.title);
        if (typeof callback === 'function') {
          callback();
        }
      } catch (e) {
        console.error('Erro ao gerar PDF:', e.message);
        window.showError('Erro ao gerar PDF.');
        if (typeof callback === 'function') {
          callback();
        }
      }
    };
    img.onerror = function() {
      console.error('Erro ao carregar logotipo NAVIX.png');
      window.showError('Erro ao carregar logotipo.');
      if (typeof callback === 'function') {
        callback();
      }
    };
  } catch (e) {
    console.error('Erro ao iniciar geração do PDF:', e.message);
    window.showError('Erro ao iniciar geração do PDF.');
    if (typeof callback === 'function') {
      callback();
    }
  }
};
document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando details.js');

  // Verificar elementos essenciais
  const userNameElement = document.getElementById('user-name');
  const equipmentDetails = document.getElementById('equipment-details');
  const equipmentHistoryBody = document.getElementById('equipment-history-body');
  const statusFilter = document.getElementById('status-filter');
  const dateFilter = document.getElementById('date-filter');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const pageInfoElement = document.getElementById('page-info');
  const criticalInfo = document.getElementById('critical-info');
  const lastMaintenance = document.getElementById('last-maintenance');
  const lastInspection = document.getElementById('last-inspection');
  const lastUnavailability = document.getElementById('last-unavailability');
  const statusChart = document.getElementById('status-chart');

  if (!userNameElement || !equipmentDetails || !equipmentHistoryBody || 
      !statusFilter || !dateFilter || !prevPageButton || !nextPageButton || 
      !pageInfoElement || !criticalInfo || !lastMaintenance || 
      !lastInspection || !lastUnavailability || !statusChart) {
    console.error('Elementos essenciais não encontrados:', {
      userNameElement, equipmentDetails, equipmentHistoryBody,
      statusFilter, dateFilter, prevPageButton, nextPageButton,
      pageInfoElement, criticalInfo, lastMaintenance, lastInspection,
      lastUnavailability, statusChart
    });
    window.showError('Erro interno: elementos essenciais não encontrados.');
    return;
  }

  // Verificar login
  const userName = localStorage.getItem('userName');
  const userType = localStorage.getItem('userType');
  if (!userName || !userType) {
    console.log('Usuário não logado. Redirecionando para index.html');
    window.location.href = 'index.html';
    return;
  }
  userNameElement.textContent = `${userName} (${userType})`;

  // Obter ID do equipamento da URL
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentId = parseInt(urlParams.get('id'));
  if (!equipmentId) {
    window.showError('ID do equipamento não especificado.');
    window.location.href = 'equipments.html';
    return;
  }

  // Carregar dados dos equipamentos
  if (typeof window.loadEquipments !== 'function') {
    console.error('window.loadEquipments não está definido.');
    window.showError('Erro: função de carregamento de equipamentos não encontrada.');
    return;
  }
  window.equipments = window.loadEquipments();
  if (!Array.isArray(window.equipments)) {
    console.warn('window.equipments não é um array. Inicializando como vazio.');
    window.equipments = [];
  }
  const equipment = window.equipments.find(eq => eq.id === equipmentId);
  if (!equipment) {
    window.showError('Equipamento não encontrado.');
    window.location.href = 'equipments.html';
    return;
  }

  // Variáveis de controle para filtros, ordenação e paginação
  let filteredEvents = [];
  let currentPage = 1;
  const eventsPerPage = 10;
  let sortColumn = 'timestamp';
  let sortDirection = 'desc';
  let chartInstance = null; // Para armazenar a instância do gráfico

  // Renderizar detalhes do equipamento
  function renderEquipmentDetails() {
    console.log('Renderizando detalhes do equipamento:', equipmentId);
    try {
      document.getElementById('equipment-name').textContent = equipment.name;
      document.getElementById('equipment-type').textContent = equipment.type;
      document.getElementById('equipment-status').textContent = equipment.status;
      document.getElementById('equipment-manufacturer').textContent = equipment.manufacturer || 'N/A';
      document.getElementById('equipment-hourmeter').textContent = equipment.hourmeter || 0;
      document.getElementById('equipment-description').textContent = equipment.details || 'N/A';
    } catch (e) {
      console.error('Erro ao renderizar detalhes do equipamento:', e.message);
      window.showError('Erro ao renderizar detalhes do equipamento.');
    }
  }

  // Renderizar informações críticas
  function renderCriticalInfo() {
    console.log('Renderizando informações críticas...');
    try {
      const events = Array.isArray(equipment.history) ? equipment.history : [];
      const lastMaintenanceEvent = events.filter(ev => ev.status === 'Manutenção').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      const lastInspectionEvent = events.filter(ev => ev.status === 'Inspeção').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      const lastUnavailabilityEvent = events.filter(ev => ev.status === 'Indisponível').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      lastMaintenance.textContent = lastMaintenanceEvent 
        ? new Date(lastMaintenanceEvent.timestamp).toLocaleString('pt-BR') 
        : 'Nenhuma manutenção registrada.';
      lastInspection.textContent = lastInspectionEvent 
        ? new Date(lastInspectionEvent.timestamp).toLocaleString('pt-BR') 
        : 'Nenhuma inspeção registrada.';
      lastUnavailability.textContent = lastUnavailabilityEvent 
        ? new Date(lastUnavailabilityEvent.timestamp).toLocaleString('pt-BR') 
        : 'Nenhuma indisponibilidade registrada.';
    } catch (e) {
      console.error('Erro ao renderizar informações críticas:', e.message);
      window.showError('Erro ao renderizar informações críticas.');
    }
  }

  // Renderizar gráfico de status
  function renderStatusChart() {
    console.log('Renderizando gráfico de status...');
    try {
      const events = Array.isArray(equipment.history) ? equipment.history : [];
      if (events.length === 0) {
        statusChart.innerHTML = '<p class="text-center text-gray-600 py-4">Nenhum evento para exibir no gráfico.</p>';
        return;
      }

      // Preparar dados para o gráfico
      const timestamps = events.map(ev => new Date(ev.timestamp));
      const earliestDate = new Date(Math.min(...timestamps));
      const latestDate = new Date(Math.max(...timestamps));
      const labels = [];
      const statuses = ['Disponível', 'Indisponível', 'Manutenção', 'Inspeção'];
      const datasets = statuses.map(status => ({
        label: status,
        data: [],
        borderColor: status === 'Disponível' ? '#34D399' : 
                    status === 'Indisponível' ? '#EF4444' : 
                    status === 'Manutenção' ? '#F59E0B' : '#3B82F6',
        backgroundColor: status === 'Disponível' ? 'rgba(52, 211, 153, 0.2)' : 
                        status === 'Indisponível' ? 'rgba(239, 68, 68, 0.2)' : 
                        status === 'Manutenção' ? 'rgba(245, 158, 11, 0.2)' : 
                        'rgba(59, 130, 246, 0.2)',
        fill: true
      }));

      // Gerar pontos de dados para o gráfico (timeline)
      const startDate = new Date(earliestDate);
      const endDate = new Date(latestDate);
      const intervalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      const step = Math.max(1, Math.floor(intervalDays / 20)); // Limitar a 20 pontos para evitar excesso

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + step)) {
        labels.push(new Date(d).toLocaleDateString('pt-BR'));
        const currentTime = d.getTime();
        const lastEvent = events
          .filter(ev => new Date(ev.timestamp).getTime() <= currentTime)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const currentStatus = lastEvent ? lastEvent.status : 'Disponível';

        statuses.forEach((status, index) => {
          datasets[index].data.push(currentStatus === status ? 1 : 0);
        });
      }

      // Configuração do gráfico com Chart.js
      const chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: { display: true, text: 'Data' }
            },
            y: {
              title: { display: true, text: 'Status' },
              ticks: {
                stepSize: 1,
                callback: (value) => value === 1 ? 'Ativo' : ''
              },
              min: 0,
              max: 1
            }
          },
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Evolução do Status ao Longo do Tempo' }
          }
        }
      };

      // Renderizar o gráfico
      statusChart.innerHTML = '<canvas id="status-chart-canvas"></canvas>';
      const ctx = document.getElementById('status-chart-canvas').getContext('2d');
      chartInstance = new Chart(ctx, chartConfig);
      console.log('Gráfico de status renderizado com sucesso.');
    } catch (e) {
      console.error('Erro ao renderizar gráfico de status:', e.message);
      window.showError('Erro ao renderizar gráfico de status.');
      statusChart.innerHTML = '<p class="text-center text-gray-600 py-4">Erro ao carregar o gráfico.</p>';
    }
  }

  // Função para exportar o gráfico para PDF
  window.exportChartToPDF = function() {
    console.log('Exportando gráfico para PDF...');
    try {
      if (!chartInstance) {
        window.showError('Gráfico não disponível para exportação.');
        return;
      }

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
          doc.text('Gráfico de Evolução do Status', 105, 25, { align: 'center' });
          doc.addImage(img, 'PNG', 10, 10, 20, 20);

          // Informações adicionais
          doc.setFontSize(10);
          doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 35);
          doc.text(`Usuário: ${localStorage.getItem('userName') || 'Desconhecido'} (${localStorage.getItem('userType') || 'N/A'})`, 10, 40);

          // Capturar o gráfico como imagem
          const chartCanvas = document.getElementById('status-chart-canvas');
          const chartImage = chartCanvas.toDataURL('image/png');
          doc.addImage(chartImage, 'PNG', 10, 50, 190, 100);

          // Rodapé
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
          }

          // Salvar o PDF
          doc.save(`grafico_status_equipamento_${equipmentId}_${new Date().toISOString().replace(/[^0-9]/g, '')}.pdf`);
          window.showSuccess('Gráfico exportado para PDF com sucesso.');
        } catch (e) {
          console.error('Erro ao exportar gráfico para PDF:', e.message);
          window.showError('Erro ao exportar gráfico para PDF.');
        }
      };
      img.onerror = function() {
        console.error('Erro ao carregar logotipo NAVIX.png');
        window.showError('Erro ao carregar logotipo.');
      };
    } catch (e) {
      console.error('Erro ao iniciar exportação do gráfico:', e.message);
      window.showError('Erro ao exportar gráfico.');
    }
  };

  // Função para aplicar filtros
  window.applyFilters = function() {
    const status = statusFilter.value;
    const date = dateFilter.value ? new Date(dateFilter.value) : null;
    console.log('Aplicando filtros no histórico:', { status, date });

    filteredEvents = Array.isArray(equipment.history) ? equipment.history.filter(event => {
      const matchesStatus = !status || event.status === status;
      const matchesDate = !date || new Date(event.timestamp) >= date;
      return matchesStatus && matchesDate;
    }) : [];

    currentPage = 1;
    renderEventList();
  };

  // Função para limpar filtros
  window.resetFilters = function() {
    statusFilter.value = '';
    dateFilter.value = '';
    applyFilters();
  };

  // Função para ordenar a tabela
  window.sortTable = function(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    console.log('Ordenando tabela por:', column, sortDirection);
    filteredEvents.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];
      if (column === 'timestamp') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    currentPage = 1;
    renderEventList();
  };

  // Função para mudar de página
  window.changePage = function(delta) {
    currentPage += delta;
    renderEventList();
  };

  // Função para renderizar a lista de eventos
  function renderEventList() {
    console.log('Renderizando lista de eventos...');
    try {
      equipmentHistoryBody.innerHTML = '';

      if (filteredEvents.length === 0) {
        equipmentHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-600 py-4">Nenhum evento registrado.</td></tr>';
        console.log('Nenhum evento para renderizar.');
        updatePaginationControls();
        return;
      }

      const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
      currentPage = Math.max(1, Math.min(currentPage, totalPages));
      const start = (currentPage - 1) * eventsPerPage;
      const end = start + eventsPerPage;
      const eventsToShow = filteredEvents.slice(start, end);

      eventsToShow.forEach(event => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2 border">${new Date(event.timestamp).toLocaleString('pt-BR')}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.status)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.details || 'N/A')}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.responsible || 'N/A')}</td>
        `;
        equipmentHistoryBody.appendChild(row);
      });

      console.log('Lista de eventos renderizada com', eventsToShow.length, 'itens na página', currentPage);
      updatePaginationControls();
    } catch (e) {
      console.error('Erro ao renderizar lista de eventos:', e.message);
      window.showError('Erro ao renderizar lista de eventos.');
    }
  }

  // Função para atualizar controles de paginação
  function updatePaginationControls() {
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    pageInfoElement.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
  }

  // Inicializar a página
  try {
    renderEquipmentDetails();
    renderCriticalInfo();
    renderStatusChart();
    window.renderOperationSelector(equipmentId);
    window.renderOperationDetails(equipmentId);
    applyFilters();
  } catch (e) {
    console.error('Erro ao inicializar equipment-details:', e.message);
    window.showError('Erro ao inicializar página.');
    window.location.href = 'equipments.html';
  }
});
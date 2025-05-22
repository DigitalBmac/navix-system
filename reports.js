document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando reports.js');

  // --- Inicialização: Verificação de Elementos e Login ---

  // Verificar elementos essenciais da página
  const userNameElement = document.getElementById('user-name');
  const equipmentFilter = document.getElementById('equipment-filter');
  const startDateFilter = document.getElementById('start-date');
  const endDateFilter = document.getElementById('end-date');
  const reportTableBody = document.getElementById('report-table-body');
  const downtimeChart = document.getElementById('downtime-chart');

  if (!userNameElement || !equipmentFilter || !startDateFilter || !endDateFilter || !reportTableBody || !downtimeChart) {
    console.error('Elementos essenciais não encontrados:', {
      userNameElement, equipmentFilter, startDateFilter, endDateFilter, reportTableBody, downtimeChart
    });
    window.showError('Erro interno: elementos essenciais não encontrados.');
    return;
  }

  // Verificar login do usuário
  const userName = localStorage.getItem('userName');
  const userType = localStorage.getItem('userType');
  if (!userName || !userType) {
    console.log('Usuário não logado. Redirecionando para index.html');
    window.location.href = 'index.html';
    return;
  }
  userNameElement.textContent = `${userName} (${userType})`;

  // Carregar equipamentos do localStorage
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
  console.log('window.equipments carregado:', window.equipments);

  // Preencher filtro de equipamentos no dropdown
  window.equipments.forEach(eq => {
    const option = document.createElement('option');
    option.value = eq.id;
    option.textContent = eq.name;
    equipmentFilter.appendChild(option);
  });

  // --- Variáveis de Controle ---

  // Variáveis para gerenciar os equipamentos filtrados
  let filteredEquipments = window.equipments;

  // --- Funções de Filtros ---

  // Função para aplicar filtros
  window.applyFilters = function() {
    const equipmentId = parseInt(equipmentFilter.value) || null;
    const startDate = startDateFilter.value ? new Date(startDateFilter.value) : null;
    const endDate = endDateFilter.value ? new Date(endDateFilter.value) : null;
    console.log('Aplicando filtros:', { equipmentId, startDate, endDate });

    // Filtrar equipamentos com base no ID selecionado
    filteredEquipments = window.equipments.filter(eq => {
      const matchesEquipment = !equipmentId || eq.id === equipmentId;
      return matchesEquipment;
    });

    // Renderizar tabela e gráfico com os filtros aplicados
    renderReportTable(startDate, endDate);
    renderDowntimeChart(startDate, endDate);
  };

  // Função para limpar filtros
  window.resetFilters = function() {
    equipmentFilter.value = '';
    startDateFilter.value = '';
    endDateFilter.value = '';
    applyFilters();
  };

  // --- Funções de Cálculo de Métricas ---

  // Função para calcular métricas de desempenho de um equipamento
  function calculateMetrics(equipment, startDate, endDate) {
    const history = Array.isArray(equipment.history) ? equipment.history : [];
    let downtimeHours = 0;
    let maintenanceIntervals = [];
    let totalTimeHours = 0;
    let availableTimeHours = 0;

    // Filtrar eventos dentro do período especificado
    const filteredHistory = history.filter(event => {
      const eventDate = new Date(event.timestamp);
      return (!startDate || eventDate >= startDate) && (!endDate || eventDate <= endDate);
    });

    if (filteredHistory.length === 0) {
      return { downtimeHours: 0, avgMaintenanceInterval: 0, availability: 100 };
    }

    // Calcular tempo de indisponibilidade (em horas)
    for (let i = 0; i < filteredHistory.length - 1; i++) {
      const currentEvent = filteredHistory[i];
      const nextEvent = filteredHistory[i + 1];
      if (currentEvent.status === 'Indisponível') {
        const start = new Date(currentEvent.timestamp);
        const end = new Date(nextEvent.timestamp);
        const diffHours = (end - start) / (1000 * 60 * 60); // Diferença em horas
        downtimeHours += diffHours;
      }
    }

    // Calcular tempo médio entre manutenções (em dias)
    const maintenanceEvents = filteredHistory.filter(event => event.status === 'Manutenção');
    if (maintenanceEvents.length > 1) {
      for (let i = 0; i < maintenanceEvents.length - 1; i++) {
        const start = new Date(maintenanceEvents[i].timestamp);
        const end = new Date(maintenanceEvents[i + 1].timestamp);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24); // Diferença em dias
        maintenanceIntervals.push(diffDays);
      }
    }
    const avgMaintenanceInterval = maintenanceIntervals.length > 0 
      ? maintenanceIntervals.reduce((a, b) => a + b, 0) / maintenanceIntervals.length 
      : 0;

    // Calcular percentual de disponibilidade
    const firstEvent = filteredHistory[0];
    const lastEvent = filteredHistory[filteredHistory.length - 1];
    if (firstEvent && lastEvent) {
      const periodStart = startDate || new Date(firstEvent.timestamp);
      const periodEnd = endDate || new Date(lastEvent.timestamp);
      totalTimeHours = (periodEnd - periodStart) / (1000 * 60 * 60); // Total de horas no período
      availableTimeHours = totalTimeHours - downtimeHours;
    }
    const availability = totalTimeHours > 0 ? (availableTimeHours / totalTimeHours) * 100 : 100;

    return {
      downtimeHours: downtimeHours.toFixed(2),
      avgMaintenanceInterval: avgMaintenanceInterval.toFixed(2),
      availability: availability.toFixed(2)
    };
  }

  // --- Funções de Renderização ---

  // Função para renderizar a tabela de relatórios
  function renderReportTable(startDate, endDate) {
    console.log('Renderizando tabela de relatórios...');
    try {
      reportTableBody.innerHTML = '';
      if (filteredEquipments.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-600 py-4">Nenhum equipamento encontrado.</td></tr>';
        return;
      }

      filteredEquipments.forEach(eq => {
        const metrics = calculateMetrics(eq, startDate, endDate);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2 border">${window.escapeHtml(eq.name)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(eq.type)}</td>
          <td class="px-4 py-2 border">${metrics.downtimeHours} h</td>
          <td class="px-4 py-2 border">${metrics.avgMaintenanceInterval} dias</td>
          <td class="px-4 py-2 border">${metrics.availability}%</td>
        `;
        reportTableBody.appendChild(row);
      });
    } catch (e) {
      console.error('Erro ao renderizar tabela de relatórios:', e.message);
      window.showError('Erro ao renderizar relatórios.');
    }
  }

  // Função para renderizar o gráfico de indisponibilidade
  function renderDowntimeChart(startDate, endDate) {
    console.log('Renderizando gráfico de indisponibilidade...');
    try {
      const labels = filteredEquipments.map(eq => eq.name);
      const data = filteredEquipments.map(eq => {
        const metrics = calculateMetrics(eq, startDate, endDate);
        return metrics.downtimeHours;
      });

      if (labels.length === 0) {
        downtimeChart.innerHTML = '<p class="text-center text-gray-600 py-4">Nenhum dado para exibir no gráfico.</p>';
        return;
      }

      // Configuração do gráfico com Chart.js
      const chartConfig = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Tempo de Indisponibilidade (h)',
            data: data,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: '#EF4444',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: { display: true, text: 'Equipamento' }
            },
            y: {
              title: { display: true, text: 'Horas' },
              beginAtZero: true
            }
          },
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Tempo de Indisponibilidade por Equipamento' }
          }
        }
      };

      // Renderizar o gráfico
      downtimeChart.innerHTML = '<canvas id="downtime-chart-canvas"></canvas>';
      const ctx = document.getElementById('downtime-chart-canvas').getContext('2d');
      new Chart(ctx, chartConfig);
      console.log('Gráfico de indisponibilidade renderizado com sucesso.');
    } catch (e) {
      console.error('Erro ao renderizar gráfico de indisponibilidade:', e.message);
      window.showError('Erro ao renderizar gráfico.');
      downtimeChart.innerHTML = '<p class="text-center text-gray-600 py-4">Erro ao carregar o gráfico.</p>';
    }
  }

  // --- Funções de Exportação ---

  // Função para exportar relatórios para PDF
  window.exportToPDF = function() {
    console.log('Exportando relatórios para PDF...');
    try {
      const startDate = startDateFilter.value ? new Date(startDateFilter.value) : null;
      const endDate = endDateFilter.value ? new Date(endDateFilter.value) : null;
      const data = filteredEquipments.map(eq => {
        const metrics = calculateMetrics(eq, startDate, endDate);
        return [
          eq.name,
          eq.type,
          `${metrics.downtimeHours} h`,
          `${metrics.avgMaintenanceInterval} dias`,
          `${metrics.availability}%`
        ];
      });

      const extractData = {
        title: 'Relatório de Desempenho de Equipamentos',
        headers: ['Equipamento', 'Tipo', 'Tempo de Indisponibilidade (h)', 'Tempo Médio Entre Manutenções (dias)', 'Disponibilidade (%)'],
        data: data
      };

      window.generateExtract(extractData, () => {
        window.showSuccess('Relatório exportado para PDF com sucesso.');
      });
    } catch (e) {
      console.error('Erro ao exportar relatórios para PDF:', e.message);
      window.showError('Erro ao exportar relatórios para PDF.');
    }
  };

  // Função para exportar relatórios para CSV
  window.exportToCSV = function() {
    console.log('Exportando relatórios para CSV...');
    try {
      const startDate = startDateFilter.value ? new Date(startDateFilter.value) : null;
      const endDate = endDateFilter.value ? new Date(endDateFilter.value) : null;
      const headers = ['Equipamento', 'Tipo', 'Tempo de Indisponibilidade (h)', 'Tempo Médio Entre Manutenções (dias)', 'Disponibilidade (%)'];
      const rows = filteredEquipments.map(eq => {
        const metrics = calculateMetrics(eq, startDate, endDate);
        return [
          `"${eq.name}"`,
          `"${eq.type}"`,
          metrics.downtimeHours,
          metrics.avgMaintenanceInterval,
          metrics.availability
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_equipamentos_${new Date().toISOString().replace(/[^0-9]/g, '')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showSuccess('Relatório exportado para CSV com sucesso.');
    } catch (e) {
      console.error('Erro ao exportar relatórios para CSV:', e.message);
      window.showError('Erro ao exportar relatórios para CSV.');
    }
  };

  // --- Inicialização da Página ---

  try {
    applyFilters();
  } catch (e) {
    console.error('Erro ao inicializar reports:', e.message);
    window.showError('Erro ao inicializar relatórios.');
  }
});
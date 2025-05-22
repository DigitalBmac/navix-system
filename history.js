document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando history.js');

  // Verificar elementos essenciais
  const userNameElement = document.getElementById('user-name');
  const equipmentFilter = document.getElementById('equipment-filter');
  const eventListElement = document.getElementById('event-list');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const pageInfoElement = document.getElementById('page-info');
  const generateExtractButton = document.getElementById('generate-extract-btn');

  if (!userNameElement || !equipmentFilter || !eventListElement || 
      !prevPageButton || !nextPageButton || !pageInfoElement || !generateExtractButton) {
    console.error('Elementos essenciais não encontrados:', {
      userNameElement, equipmentFilter, eventListElement,
      prevPageButton, nextPageButton, pageInfoElement, generateExtractButton
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

  // Carregar equipamentos
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

  // Preencher filtro de equipamentos
  window.equipments.forEach(eq => {
    const option = document.createElement('option');
    option.value = eq.id;
    option.textContent = eq.name;
    equipmentFilter.appendChild(option);
  });

  // Variáveis de controle para filtros, ordenação e paginação
  let filteredEvents = [];
  let currentPage = 1;
  const eventsPerPage = 10;
  let sortColumn = 'timestamp';
  let sortDirection = 'desc';

  // Função para aplicar filtros
  window.applyFilters = function() {
    const selectedEquipmentId = parseInt(equipmentFilter.value) || null;
    console.log('Aplicando filtro por equipamento:', selectedEquipmentId);
    filteredEvents = [];
    window.equipments.forEach(eq => {
      if (!selectedEquipmentId || eq.id === selectedEquipmentId) {
        if (Array.isArray(eq.history) && eq.history.length > 0) {
          eq.history.forEach(event => {
            filteredEvents.push({
              equipmentId: eq.id,
              equipmentName: eq.name,
              timestamp: event.timestamp,
              status: event.status,
              details: event.details || 'N/A',
              responsible: event.responsible || 'N/A'
            });
          });
        }
      }
    });
    currentPage = 1;
    renderEventList();
  };

  // Função para limpar filtros
  window.resetFilters = function() {
    equipmentFilter.value = '';
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
      eventListElement.innerHTML = '';

      if (filteredEvents.length === 0) {
        eventListElement.innerHTML = '<tr><td colspan="5" class="text-center text-gray-600 py-4">Nenhum evento registrado.</td></tr>';
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
          <td class="px-4 py-2 border">${window.escapeHtml(event.equipmentName)}</td>
          <td class="px-4 py-2 border">${new Date(event.timestamp).toLocaleString('pt-BR')}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.status)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.details)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.responsible)}</td>
        `;
        eventListElement.appendChild(row);
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

  // Função para gerar extrato dos eventos filtrados
  window.generateExtractForFilteredEvents = function() {
    console.log('Gerando extrato para eventos filtrados...');
    try {
      generateExtractButton.textContent = 'Gerando PDF...';
      generateExtractButton.disabled = true;

      if (filteredEvents.length === 0) {
        window.showError('Nenhum evento para gerar o extrato.');
        return;
      }

      const selectedEquipmentId = parseInt(equipmentFilter.value) || null;
      const equipmentName = selectedEquipmentId 
        ? window.equipments.find(eq => eq.id === selectedEquipmentId)?.name 
        : 'Todos os Equipamentos';

      const extractData = {
        title: `Extrato de Eventos - ${equipmentName}`,
        headers: ['Equipamento', 'Data/Hora', 'Status', 'Detalhes', 'Responsável'],
        data: filteredEvents.map(event => [
          event.equipmentName,
          new Date(event.timestamp).toLocaleString('pt-BR'),
          event.status,
          event.details,
          event.responsible
        ])
      };

      window.generateExtract(extractData, () => {
        generateExtractButton.textContent = 'Gerar Extrato';
        generateExtractButton.disabled = false;
        window.showSuccess('Extrato gerado com sucesso.');
      });
    } catch (e) {
      console.error('Erro ao gerar extrato:', e.message);
      window.showError('Erro ao gerar extrato.');
      generateExtractButton.textContent = 'Gerar Extrato';
      generateExtractButton.disabled = false;
    }
  };

  // Inicializar a página
  try {
    applyFilters();
  } catch (e) {
    console.error('Erro ao inicializar history:', e.message);
    window.showError('Erro ao inicializar histórico.');
  }
});
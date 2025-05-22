document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando dashboard.js');

  // Verificar elementos essenciais
  const userNameElement = document.getElementById('user-name');
  const availableCountElement = document.getElementById('available-count');
  const unavailableCountElement = document.getElementById('unavailable-count');
  const maintenanceCountElement = document.getElementById('maintenance-count');
  const inspectionCountElement = document.getElementById('inspection-count');
  const equipmentListElement = document.getElementById('equipment-list');
  const pendingApprovalsSection = document.getElementById('pending-approvals-section');
  const pendingApprovalsElement = document.getElementById('pending-approvals');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const notificationsList = document.getElementById('notifications-list');

  if (!userNameElement || !availableCountElement || !unavailableCountElement || 
      !maintenanceCountElement || !inspectionCountElement || !equipmentListElement || 
      !pendingApprovalsSection || !pendingApprovalsElement || !searchInput || 
      !statusFilter || !notificationsList) {
    console.error('Elementos essenciais não encontrados:', {
      userNameElement, availableCountElement, unavailableCountElement,
      maintenanceCountElement, inspectionCountElement, equipmentListElement,
      pendingApprovalsSection, pendingApprovalsElement, searchInput, statusFilter,
      notificationsList
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
  userNameElement.textContent = userName;

  // Carregar equipamentos
  let equipments = [];
  const loadEquipmentsData = async () => {
    if (typeof window.loadEquipments !== 'function') {
      console.error('window.loadEquipments não está definido.');
      window.showError('Erro: função de carregamento de equipamentos não encontrada.');
      return;
    }
    equipments = await window.loadEquipments();
    console.log('window.equipments carregado:', equipments);

    // Carregar o histórico de cada equipamento
    for (let eq of equipments) {
      eq.history = await window.loadEquipmentHistory(eq.id);
    }
    console.log('Histórico dos equipamentos carregado:', equipments);
  };

  // Mostrar seção de aprovações pendentes apenas para admin
  if (userType === 'admin') {
    pendingApprovalsSection.classList.remove('hidden');
  }

  // Carregar configurações de alertas e API
  const loadSettings = () => {
    const settings = localStorage.getItem('alertSettings');
    if (!settings) {
      const defaultSettings = {
        downtimeThreshold: 24, // Horas
        maintenanceThreshold: 30, // Dias
        maintenanceDurationThreshold: 48, // Horas
        inspectionDurationThreshold: 48, // Horas
        apiUpdateInterval: 30 // Segundos
      };
      localStorage.setItem('alertSettings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(settings);
  };

  // Configurar intervalo de atualização via API
  const settings = loadSettings();
  const apiUpdateInterval = settings.apiUpdateInterval * 1000; // Converter para milissegundos

  // Função para atualizar contadores
  function updateStatusCounts() {
    const counts = {
      Disponível: 0,
      Indisponível: 0,
      Manutenção: 0,
      Inspeção: 0
    };
    equipments.forEach(eq => {
      if (counts.hasOwnProperty(eq.status)) {
        counts[eq.status]++;
      }
    });
    availableCountElement.textContent = counts['Disponível'];
    unavailableCountElement.textContent = counts['Indisponível'];
    maintenanceCountElement.textContent = counts['Manutenção'];
    inspectionCountElement.textContent = counts['Inspeção'];
    console.log('Contadores atualizados:', counts);
  }

  // Função para aplicar filtros
  window.applyFilters = function() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    renderEquipmentList(searchTerm, selectedStatus);
  };

  // Função para filtrar por status ao clicar nos contadores
  window.filterByStatus = function(status) {
    statusFilter.value = status;
    applyFilters();
  };

  // Função para limpar filtros
  window.resetFilters = function() {
    searchInput.value = '';
    statusFilter.value = '';
    applyFilters();
  };

  // Função para renderizar a lista de equipamentos
  function renderEquipmentList(searchTerm = '', statusFilter = '') {
    console.log('Renderizando lista de equipamentos com filtros:', { searchTerm, statusFilter });
    try {
      equipmentListElement.innerHTML = '';
      const filteredEquipments = equipments.filter(eq => {
        const matchesSearch = !searchTerm || 
          eq.name.toLowerCase().includes(searchTerm) || 
          eq.type.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || eq.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      if (filteredEquipments.length === 0) {
        equipmentListElement.innerHTML = '<tr><td colspan="6" class="text-center text-gray-600 py-4">Nenhum equipamento encontrado.</td></tr>';
        console.log('Nenhum equipamento para renderizar após filtros.');
        return;
      }

      filteredEquipments.forEach(eq => {
        const row = document.createElement('tr');
        const latestEvent = Array.isArray(eq.history) && eq.history.length > 0 
          ? eq.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] 
          : null;
        const lastOccurrence = latestEvent 
          ? new Date(latestEvent.timestamp).toLocaleString('pt-BR') 
          : 'N/A';
        const responsible = latestEvent && latestEvent.responsible 
          ? latestEvent.responsible 
          : localStorage.getItem('userName') || 'N/A';

        row.innerHTML = `
          <td class="px-4 py-2 border">${window.escapeHtml(eq.name)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(eq.type)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(eq.status)}</td>
          <td class="px-4 py-2 border">${lastOccurrence}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(responsible)}</td>
          <td class="px-4 py-2 border">
            <button onclick="window.location.href='equipment-details.html?id=${eq.id}'" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Detalhes</button>
          </td>
        `;
        equipmentListElement.appendChild(row);
      });
      console.log('Lista de equipamentos renderizada com', filteredEquipments.length, 'itens.');
    } catch (e) {
      console.error('Erro ao renderizar lista de equipamentos:', e.message);
      window.showError('Erro ao renderizar lista de equipamentos.');
    }
  }

  // Função para renderizar aprovações pendentes
  function renderPendingApprovals() {
    console.log('Renderizando aprovações pendentes...');
    try {
      pendingApprovalsElement.innerHTML = '';
      let pendingEvents = [];
      equipments.forEach(eq => {
        if (Array.isArray(eq.history)) {
          eq.history.forEach(event => {
            if (event.pendingApproval) {
              pendingEvents.push({
                equipmentId: eq.id,
                equipmentName: eq.name,
                timestamp: event.timestamp,
                details: event.details || 'N/A',
                responsible: event.responsible || localStorage.getItem('userName') || 'N/A'
              });
            }
          });
        }
      });

      if (pendingEvents.length === 0) {
        pendingApprovalsElement.innerHTML = '<tr><td colspan="5" class="text-center text-gray-600 py-4">Nenhum evento pendente de aprovação.</td></tr>';
        console.log('Nenhum evento pendente para renderizar.');
        return;
      }

      pendingEvents.forEach(event => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-4 py-2 border">${window.escapeHtml(event.equipmentName)}</td>
          <td class="px-4 py-2 border">${new Date(event.timestamp).toLocaleString('pt-BR')}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.details)}</td>
          <td class="px-4 py-2 border">${window.escapeHtml(event.responsible)}</td>
          <td class="px-4 py-2 border">
            <button onclick="approveEvent(${event.equipmentId}, '${event.timestamp}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2">Aprovar</button>
            <button onclick="rejectEvent(${event.equipmentId}, '${event.timestamp}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Rejeitar</button>
          </td>
        `;
        pendingApprovalsElement.appendChild(row);
      });
      console.log('Aprovações pendentes renderizadas com', pendingEvents.length, 'itens.');
    } catch (e) {
      console.error('Erro ao renderizar aprovações pendentes:', e.message);
      window.showError('Erro ao renderizar aprovações pendentes.');
    }
  }

  // Funções para aprovar e rejeitar eventos
  window.approveEvent = async function(equipmentId, timestamp) {
    console.log('Aprovando evento:', { equipmentId, timestamp });
    try {
      const equipment = equipments.find(eq => eq.id === equipmentId);
      if (!equipment || !Array.isArray(equipment.history)) {
        window.showError('Equipamento ou histórico não encontrado.');
        return;
      }
      const event = equipment.history.find(ev => ev.timestamp === timestamp && ev.pendingApproval);
      if (!event) {
        window.showError('Evento não encontrado ou já aprovado/rejeitado.');
        return;
      }
      event.pendingApproval = false;
      await window.saveEquipmentHistory(equipmentId, equipment.history);
      window.showSuccess('Evento aprovado com sucesso.');
      renderPendingApprovals();
      renderEquipmentList();
      updateStatusCounts();
      renderNotifications();
    } catch (e) {
      console.error('Erro ao aprovar evento:', e.message);
      window.showError('Erro ao aprovar evento.');
    }
  };

  window.rejectEvent = async function(equipmentId, timestamp) {
    console.log('Rejeitando evento:', { equipmentId, timestamp });
    try {
      const equipment = equipments.find(eq => eq.id === equipmentId);
      if (!equipment || !Array.isArray(equipment.history)) {
        window.showError('Equipamento ou histórico não encontrado.');
        return;
      }
      const eventIndex = equipment.history.findIndex(ev => ev.timestamp === timestamp && ev.pendingApproval);
      if (eventIndex === -1) {
        window.showError('Evento não encontrado ou já aprovado/rejeitado.');
        return;
      }
      equipment.history.splice(eventIndex, 1);
      if (equipment.history.length > 0) {
        equipment.status = equipment.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].status;
      } else {
        equipment.status = 'Disponível';
      }
      await window.saveEquipmentHistory(equipmentId, equipment.history);
      const { error } = await supabase
        .from('equipments')
        .update({ status: equipment.status })
        .eq('id', equipmentId);
      if (error) {
        console.error('Erro ao atualizar status do equipamento:', error.message);
        window.showError('Erro ao atualizar status do equipamento.');
        return;
      }
      window.showSuccess('Evento rejeitado com sucesso.');
      renderPendingApprovals();
      renderEquipmentList();
      updateStatusCounts();
      renderNotifications();
    } catch (e) {
      console.error('Erro ao rejeitar evento:', e.message);
      window.showError('Erro ao rejeitar evento.');
    }
  };

  // Função para calcular métricas de alerta
  const calculateAlerts = async () => {
    const settings = loadSettings();
    let notifications = await window.loadNotifications();
    const now = new Date();
    const newNotifications = [];

    equipments.forEach(eq => {
      const history = Array.isArray(eq.history) ? eq.history : [];
      if (history.length === 0) return;

      // Verificar indisponibilidade prolongada
      const latestEvent = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      if (latestEvent.status === 'Indisponível') {
        const downtimeHours = (now - new Date(latestEvent.timestamp)) / (1000 * 60 * 60);
        if (downtimeHours > settings.downtimeThreshold) {
          const notificationId = `downtime-${eq.id}-${latestEvent.timestamp}`;
          if (!notifications.some(n => n.id === notificationId && !n.resolved)) {
            newNotifications.push({
              id: notificationId,
              equipment_id: eq.id,
              equipment_name: eq.name,
              type: 'downtime',
              message: `Equipamento ${eq.name} está indisponível há ${downtimeHours.toFixed(1)} horas (limite: ${settings.downtimeThreshold} horas).`,
              timestamp: now.toISOString(),
              resolved: false
            });
          }
        }
      }

      // Verificar manutenção pendente
      const maintenanceEvents = history.filter(event => event.status === 'Manutenção');
      if (maintenanceEvents.length > 1) {
        const intervals = [];
        for (let i = 0; i < maintenanceEvents.length - 1; i++) {
          const start = new Date(maintenanceEvents[i].timestamp);
          const end = new Date(maintenanceEvents[i + 1].timestamp);
          const diffDays = (end - start) / (1000 * 60 * 60 * 24);
          intervals.push(diffDays);
        }
        const avgMaintenanceInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const lastMaintenance = new Date(maintenanceEvents[0].timestamp);
        const daysSinceLastMaintenance = (now - lastMaintenance) / (1000 * 60 * 60 * 24);
        if (daysSinceLastMaintenance > avgMaintenanceInterval + settings.maintenanceThreshold) {
          const notificationId = `maintenance-${eq.id}-${lastMaintenance.toISOString()}`;
          if (!notifications.some(n => n.id === notificationId && !n.resolved)) {
            newNotifications.push({
              id: notificationId,
              equipment_id: eq.id,
              equipment_name: eq.name,
              type: 'maintenance',
              message: `Equipamento ${eq.name} não recebe manutenção há ${daysSinceLastMaintenance.toFixed(1)} dias (média: ${avgMaintenanceInterval.toFixed(1)} dias, limite: ${settings.maintenanceThreshold} dias).`,
              timestamp: now.toISOString(),
              resolved: false
            });
          }
        }
      }

      // Verificar manutenção ou inspeção prolongada
      if (latestEvent.status === 'Manutenção') {
        const durationHours = (now - new Date(latestEvent.timestamp)) / (1000 * 60 * 60);
        if (durationHours > settings.maintenanceDurationThreshold) {
          const notificationId = `maintenance-duration-${eq.id}-${latestEvent.timestamp}`;
          if (!notifications.some(n => n.id === notificationId && !n.resolved)) {
            newNotifications.push({
              id: notificationId,
              equipment_id: eq.id,
              equipment_name: eq.name,
              type: 'maintenance-duration',
              message: `Equipamento ${eq.name} está em manutenção há ${durationHours.toFixed(1)} horas (limite: ${settings.maintenanceDurationThreshold} horas).`,
              timestamp: now.toISOString(),
              resolved: false
            });
          }
        }
      } else if (latestEvent.status === 'Inspeção') {
        const durationHours = (now - new Date(latestEvent.timestamp)) / (1000 * 60 * 60);
        if (durationHours > settings.inspectionDurationThreshold) {
          const notificationId = `inspection-duration-${eq.id}-${latestEvent.timestamp}`;
          if (!notifications.some(n => n.id === notificationId && !n.resolved)) {
            newNotifications.push({
              id: notificationId,
              equipment_id: eq.id,
              equipment_name: eq.name,
              type: 'inspection-duration',
              message: `Equipamento ${eq.name} está em inspeção há ${durationHours.toFixed(1)} horas (limite: ${settings.inspectionDurationThreshold} horas).`,
              timestamp: now.toISOString(),
              resolved: false
            });
          }
        }
      }
    });

    // Adicionar novas notificações às existentes
    const updatedNotifications = [...notifications, ...newNotifications];
    await window.saveNotifications(updatedNotifications);
    return updatedNotifications;
  };

  // Função para renderizar notificações
  async function renderNotifications() {
    console.log('Renderizando notificações...');
    try {
      const notifications = await calculateAlerts();
      notificationsList.innerHTML = '';

      const activeNotifications = notifications.filter(n => !n.resolved);
      if (activeNotifications.length === 0) {
        notificationsList.innerHTML = '<p class="text-center text-gray-600 py-4">Nenhuma notificação ativa.</p>';
        return;
      }

      activeNotifications.forEach(notification => {
        const div = document.createElement('div');
        div.className = 'border-l-4 border-red-500 bg-red-50 p-4 mb-2 flex justify-between items-center';
        div.innerHTML = `
          <div>
            <p class="font-semibold">${window.escapeHtml(notification.message)}</p>
            <p class="text-sm text-gray-600">Gerada em: ${new Date(notification.timestamp).toLocaleString('pt-BR')}</p>
          </div>
          <div class="flex space-x-2">
            <button onclick="resolveNotification('${notification.id}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Resolver</button>
            <button onclick="ignoreNotification('${notification.id}')" class="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Ignorar</button>
          </div>
        `;
        notificationsList.appendChild(div);
      });
    } catch (e) {
      console.error('Erro ao renderizar notificações:', e.message);
      window.showError('Erro ao renderizar notificações.');
    }
  }

  // Função para resolver uma notificação
  window.resolveNotification = async function(notificationId) {
    console.log('Resolvendo notificação:', notificationId);
    try {
      const notifications = await window.loadNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.resolved = true;
        await window.saveNotifications(notifications);
        renderNotifications();
        window.showSuccess('Notificação resolvida com sucesso.');
      }
    } catch (e) {
      console.error('Erro ao resolver notificação:', e.message);
      window.showError('Erro ao resolver notificação.');
    }
  };

  // Função para ignorar uma notificação
  window.ignoreNotification = async function(notificationId) {
    console.log('Ignorando notificação:', notificationId);
    try {
      const notifications = await window.loadNotifications();
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      await window.saveNotifications(updatedNotifications);
      renderNotifications();
      window.showSuccess('Notificação ignorada com sucesso.');
    } catch (e) {
      console.error('Erro ao ignorar notificação:', e.message);
      window.showError('Erro ao ignorar notificação.');
    }
  };

  // Configurar Realtime para atualizações automáticas
  const setupRealtimeUpdates = () => {
    // Assinatura para mudanças na tabela equipments
    supabase
      .channel('equipments-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, async (payload) => {
        console.log('Mudança detectada na tabela equipments:', payload);
        equipments = await window.loadEquipments();
        for (let eq of equipments) {
          eq.history = await window.loadEquipmentHistory(eq.id);
        }
        updateStatusCounts();
        renderEquipmentList(searchInput.value.trim().toLowerCase(), statusFilter.value);
        if (userType === 'admin') {
          renderPendingApprovals();
        }
        renderNotifications();
      })
      .subscribe();

    // Assinatura para mudanças na tabela equipment_history
    supabase
      .channel('equipment-history-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_history' }, async (payload) => {
        console.log('Mudança detectada na tabela equipment_history:', payload);
        const equipment = equipments.find(eq => eq.id === payload.new.equipment_id);
        if (equipment) {
          equipment.history = await window.loadEquipmentHistory(equipment.id);
          if (payload.new.status) {
            equipment.status = payload.new.status;
            await supabase
              .from('equipments')
              .update({ status: equipment.status })
              .eq('id', equipment.id);
          }
        }
        updateStatusCounts();
        renderEquipmentList(searchInput.value.trim().toLowerCase(), statusFilter.value);
        if (userType === 'admin') {
          renderPendingApprovals();
        }
        renderNotifications();
      })
      .subscribe();

    // Assinatura para mudanças na tabela notifications
    supabase
      .channel('notifications-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async () => {
        console.log('Mudança detectada na tabela notifications');
        renderNotifications();
      })
      .subscribe();
  };

  // Inicializar a página
  try {
    loadEquipmentsData().then(() => {
      updateStatusCounts();
      renderEquipmentList();
      if (userType === 'admin') {
        renderPendingApprovals();
      }
      renderNotifications();
      setupRealtimeUpdates();
    });
  } catch (e) {
    console.error('Erro ao inicializar dashboard:', e.message);
    window.showError('Erro ao inicializar dashboard.');
  }
});
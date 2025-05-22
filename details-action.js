window.markUnavailability = function(equipmentId, os, responsible, comments) {
  console.log('Marcando equipamento como indisponível:', equipmentId, os, responsible, comments);
  try {
    if (!equipmentId || !os || !responsible || !comments) {
      window.showError('Todos os campos (OS, Responsável, Comentários) são obrigatórios.');
      return false;
    }

    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    // Validação: não permitir marcar indisponibilidade se já estiver indisponível
    if (equipment.status === 'Indisponível') {
      window.showError('Equipamento já está indisponível.');
      return false;
    }

    // Validação: não permitir marcar indisponibilidade se estiver em manutenção ou inspeção
    if (equipment.status === 'Manutenção' || equipment.status === 'Inspeção') {
      window.showError(`Equipamento está em ${equipment.status.toLowerCase()}. Finalize a operação antes de marcar como indisponível.`);
      return false;
    }

    const timestamp = new Date().toISOString();
    const userType = localStorage.getItem('userType') || 'operacao';
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Indisponível',
      details: comments,
      os,
      responsible,
      pendingApproval: userType !== 'admin'
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Indisponível';

    window.saveEquipments(equipments);
    console.log('Equipamento marcado como indisponível:', equipment);

    if (event.pendingApproval) {
      window.showSuccess('Evento de indisponibilidade registrado. Aguardando aprovação.');
    } else {
      window.showSuccess('Equipamento marcado como indisponível com sucesso.');
    }
    return true;
  } catch (e) {
    console.error('Erro ao marcar equipamento como indisponível:', e.message);
    window.showError('Erro ao marcar equipamento como indisponível.');
    return false;
  }
};

window.releaseUnavailability = function(equipmentId) {
  console.log('Liberando equipamento da indisponibilidade:', equipmentId);
  try {
    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    if (equipment.status !== 'Indisponível') {
      window.showError('Equipamento não está indisponível.');
      return false;
    }

    const userType = localStorage.getItem('userType') || 'operacao';
    if (userType !== 'admin') {
      const latestEvent = equipment.history && equipment.history.length > 0 
        ? equipment.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] 
        : null;
      if (latestEvent && latestEvent.pendingApproval) {
        window.showError('Evento de indisponibilidade pendente de aprovação. Somente administradores podem liberar.');
        return false;
      }
    }

    const timestamp = new Date().toISOString();
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Disponível',
      details: 'Equipamento liberado da indisponibilidade.',
      responsible: userName
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Disponível';

    window.saveEquipments(equipments);
    console.log('Equipamento liberado da indisponibilidade:', equipment);
    window.showSuccess('Equipamento liberado da indisponibilidade com sucesso.');
    return true;
  } catch (e) {
    console.error('Erro ao liberar equipamento da indisponibilidade:', e.message);
    window.showError('Erro ao liberar equipamento da indisponibilidade.');
    return false;
  }
};

window.startMaintenance = function(equipmentId) {
  console.log('Iniciando manutenção para o equipamento:', equipmentId);
  try {
    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    // Validação: não permitir iniciar manutenção se já estiver em manutenção
    if (equipment.status === 'Manutenção') {
      window.showError('Equipamento já está em manutenção.');
      return false;
    }

    // Validação: não permitir iniciar manutenção se estiver indisponível ou em inspeção
    if (equipment.status === 'Indisponível') {
      window.showError('Equipamento está indisponível. Libere a indisponibilidade antes de iniciar a manutenção.');
      return false;
    }
    if (equipment.status === 'Inspeção') {
      window.showError('Equipamento está em inspeção. Finalize a inspeção antes de iniciar a manutenção.');
      return false;
    }

    const timestamp = new Date().toISOString();
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Manutenção',
      details: 'Manutenção iniciada.',
      responsible: userName
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Manutenção';

    window.saveEquipments(equipments);
    console.log('Manutenção iniciada para o equipamento:', equipment);
    window.showSuccess('Manutenção iniciada com sucesso.');
    return true;
  } catch (e) {
    console.error('Erro ao iniciar manutenção:', e.message);
    window.showError('Erro ao iniciar manutenção.');
    return false;
  }
};

window.finishMaintenance = function(equipmentId) {
  console.log('Finalizando manutenção para o equipamento:', equipmentId);
  try {
    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    if (equipment.status !== 'Manutenção') {
      window.showError('Equipamento não está em manutenção.');
      return false;
    }

    const timestamp = new Date().toISOString();
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Disponível',
      details: 'Manutenção finalizada.',
      responsible: userName
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Disponível';

    window.saveEquipments(equipments);
    console.log('Manutenção finalizada para o equipamento:', equipment);
    window.showSuccess('Manutenção finalizada com sucesso.');
    return true;
  } catch (e) {
    console.error('Erro ao finalizar manutenção:', e.message);
    window.showError('Erro ao finalizar manutenção.');
    return false;
  }
};

window.startInspection = function(equipmentId) {
  console.log('Iniciando inspeção para o equipamento:', equipmentId);
  try {
    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    // Validação: não permitir iniciar inspeção se já estiver em inspeção
    if (equipment.status === 'Inspeção') {
      window.showError('Equipamento já está em inspeção.');
      return false;
    }

    // Validação: não permitir iniciar inspeção se estiver indisponível ou em manutenção
    if (equipment.status === 'Indisponível') {
      window.showError('Equipamento está indisponível. Libere a indisponibilidade antes de iniciar a inspeção.');
      return false;
    }
    if (equipment.status === 'Manutenção') {
      window.showError('Equipamento está em manutenção. Finalize a manutenção antes de iniciar a inspeção.');
      return false;
    }

    const timestamp = new Date().toISOString();
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Inspeção',
      details: 'Inspeção iniciada.',
      responsible: userName
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Inspeção';

    window.saveEquipments(equipments);
    console.log('Inspeção iniciada para o equipamento:', equipment);
    window.showSuccess('Inspeção iniciada com sucesso.');
    return true;
  } catch (e) {
    console.error('Erro ao iniciar inspeção:', e.message);
    window.showError('Erro ao iniciar inspeção.');
    return false;
  }
};

window.finishInspection = function(equipmentId) {
  console.log('Finalizando inspeção para o equipamento:', equipmentId);
  try {
    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return false;
    }

    if (equipment.status !== 'Inspeção') {
      window.showError('Equipamento não está em inspeção.');
      return false;
    }

    const timestamp = new Date().toISOString();
    const userName = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const event = {
      timestamp,
      status: 'Disponível',
      details: 'Inspeção finalizada.',
      responsible: userName
    };

    if (!Array.isArray(equipment.history)) {
      equipment.history = [];
    }
    equipment.history.push(event);
    equipment.status = 'Disponível';

    window.saveEquipments(equipments);
    console.log('Inspeção finalizada para o equipamento:', equipment);
    window.showSuccess('Inspeção finalizada com sucesso.');
    return true;
  } catch (e) {
    console.error('Erro ao finalizar inspeção:', e.message);
    window.showError('Erro ao finalizar inspeção.');
    return false;
  }
};
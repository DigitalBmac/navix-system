window.renderOperationSelector = function(equipmentId) {
  console.log('Renderizando seletor de operações para equipamento:', equipmentId);
  try {
    const selectorDiv = document.getElementById('operation-selector');
    if (!selectorDiv) {
      console.error('Elemento operation-selector não encontrado.');
      window.showError('Erro interno: seletor de operações não encontrado.');
      return;
    }

    const operations = ['Indisponibilidade', 'Manutenção', 'Inspeção'];
    selectorDiv.innerHTML = `
      <div class="flex space-x-2 mb-4">
        ${operations.map(op => `
          <button onclick="selectOperation('${op}', ${equipmentId})" class="operation-tab px-4 py-2 rounded ${op === 'Indisponibilidade' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-600 hover:text-white">${op}</button>
        `).join('')}
      </div>
    `;
    console.log('Seletor de operações renderizado.');
  } catch (e) {
    console.error('Erro ao renderizar seletor de operações:', e.message);
    window.showError('Erro ao renderizar seletor de operações.');
  }
};

window.selectOperation = function(operation, equipmentId) {
  console.log('Selecionando operação:', operation, 'para equipamento:', equipmentId);
  try {
    const tabs = document.querySelectorAll('.operation-tab');
    tabs.forEach(tab => {
      tab.classList.remove('bg-blue-500', 'text-white');
      tab.classList.add('bg-gray-200', 'text-gray-700');
      if (tab.textContent === operation) {
        tab.classList.add('bg-blue-500', 'text-white');
      }
    });

    window.renderOperationDetails(equipmentId, operation);
  } catch (e) {
    console.error('Erro ao selecionar operação:', e.message);
    window.showError('Erro ao selecionar operação.');
  }
};

window.renderOperationDetails = function(equipmentId, operation = 'Indisponibilidade') {
  console.log('Renderizando detalhes da operação:', operation, 'para equipamento:', equipmentId);
  try {
    const detailsDiv = document.getElementById('operation-details');
    if (!detailsDiv) {
      console.error('Elemento operation-details não encontrado.');
      window.showError('Erro interno: detalhes da operação não encontrados.');
      return;
    }

    const equipments = window.loadEquipments();
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return;
    }

    const latestEvent = Array.isArray(equipment.history) && equipment.history.length > 0 
      ? equipment.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] 
      : null;
    const currentState = latestEvent 
      ? `Desde ${new Date(latestEvent.timestamp).toLocaleString('pt-BR')} - Responsável: ${window.escapeHtml(latestEvent.responsible || 'N/A')}`
      : 'Nenhum evento registrado.';

    let html = `<p class="mb-4"><strong>Estado Atual:</strong> ${window.escapeHtml(equipment.status)} ${currentState}</p>`;

    if (operation === 'Indisponibilidade') {
      if (equipment.status === 'Indisponível') {
        html += `
          <button onclick="releaseUnavailabilityAndUpdate(${equipmentId}, '${operation}')" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Liberar Indisponibilidade</button>
        `;
      } else {
        html += `
          <form id="unavailability-form-${equipmentId}" class="space-y-4">
            <div>
              <label for="os-${equipmentId}" class="block text-sm font-medium text-gray-700">OS</label>
              <input type="text" id="os-${equipmentId}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="responsible-${equipmentId}" class="block text-sm font-medium text-gray-700">Responsável</label>
              <input type="text" id="responsible-${equipmentId}" value="${window.escapeHtml(localStorage.getItem('userName') || '')}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" readonly>
            </div>
            <div>
              <label for="comments-${equipmentId}" class="block text-sm font-medium text-gray-700">Comentários</label>
              <textarea id="comments-${equipmentId}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Marcar Indisponibilidade</button>
          </form>
        `;
      }
    } else if (operation === 'Manutenção') {
      if (equipment.status === 'Manutenção') {
        html += `
          <button onclick="finishMaintenanceAndUpdate(${equipmentId}, '${operation}')" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Finalizar Manutenção</button>
        `;
      } else {
        html += `
          <button onclick="startMaintenanceAndUpdate(${equipmentId}, '${operation}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Iniciar Manutenção</button>
        `;
      }
    } else if (operation === 'Inspeção') {
      if (equipment.status === 'Inspeção') {
        html += `
          <button onclick="finishInspectionAndUpdate(${equipmentId}, '${operation}')" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Finalizar Inspeção</button>
        `;
      } else {
        html += `
          <button onclick="startInspectionAndUpdate(${equipmentId}, '${operation}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Iniciar Inspeção</button>
        `;
      }
    }

    detailsDiv.innerHTML = html;

    // Configurar formulário de indisponibilidade
    if (operation === 'Indisponibilidade' && equipment.status !== 'Indisponível') {
      const form = document.getElementById(`unavailability-form-${equipmentId}`);
      if (form) {
        const osInput = document.getElementById(`os-${equipmentId}`);
        const responsibleInput = document.getElementById(`responsible-${equipmentId}`);
        const commentsInput = document.getElementById(`comments-${equipmentId}`);
        if (osInput) {
          IMask(osInput, {
            mask: 'OS-000000',
            lazy: false,
            placeholderChar: '_'
          });
        }
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const os = osInput?.value?.trim();
          const responsible = responsibleInput?.value?.trim();
          const comments = commentsInput?.value?.trim();
          if (window.markUnavailability(equipmentId, os, responsible, comments)) {
            updatePageAfterAction(equipmentId, operation);
          }
        });
      }
    }

    console.log('Detalhes da operação renderizados.');
  } catch (e) {
    console.error('Erro ao renderizar detalhes da operação:', e.message);
    window.showError('Erro ao renderizar detalhes da operação.');
  }
};

// Funções para atualizar a página após ações
window.startMaintenanceAndUpdate = function(equipmentId, operation) {
  if (window.startMaintenance(equipmentId)) {
    updatePageAfterAction(equipmentId, operation);
  }
};

window.finishMaintenanceAndUpdate = function(equipmentId, operation) {
  if (window.finishMaintenance(equipmentId)) {
    updatePageAfterAction(equipmentId, operation);
  }
};

window.startInspectionAndUpdate = function(equipmentId, operation) {
  if (window.startInspection(equipmentId)) {
    updatePageAfterAction(equipmentId, operation);
  }
};

window.finishInspectionAndUpdate = function(equipmentId, operation) {
  if (window.finishInspection(equipmentId)) {
    updatePageAfterAction(equipmentId, operation);
  }
};

window.releaseUnavailabilityAndUpdate = function(equipmentId, operation) {
  if (window.releaseUnavailability(equipmentId)) {
    updatePageAfterAction(equipmentId, operation);
  }
};

// Função para atualizar a página sem recarregar
function updatePageAfterAction(equipmentId, operation) {
  console.log('Atualizando página após ação...');
  try {
    // Recarregar dados dos equipamentos
    window.equipments = window.loadEquipments();
    // Re-renderizar todos os elementos
    window.renderOperationDetails(equipmentId, operation);
    // Chamar funções de renderização definidas em details.js
    if (typeof window.renderEquipmentDetails === 'function') window.renderEquipmentDetails();
    if (typeof window.renderCriticalInfo === 'function') window.renderCriticalInfo();
    if (typeof window.renderStatusChart === 'function') window.renderStatusChart();
    if (typeof window.applyFilters === 'function') window.applyFilters();
  } catch (e) {
    console.error('Erro ao atualizar página após ação:', e.message);
    window.showError('Erro ao atualizar página. Recarregando...');
    window.location.reload(); // Fallback para recarregar a página
  }
}
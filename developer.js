document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando developer.js');
  console.log('Verificando autenticação do desenvolvedor...');
  const isAuthenticated = window.isDeveloperAuthenticated();
  console.log('Resultado da autenticação:', isAuthenticated);
  if (!isAuthenticated) {
    console.log('Usuário não autenticado como desenvolvedor. Redirecionando para index.html.');
    window.showError('Acesso negado. Você precisa estar autenticado como desenvolvedor.');
    window.location.href = 'index.html';
    return;
  }
  console.log('Desenvolvedor autenticado, iniciando carregamento de conteúdo.');

  // Carregar equipamentos
  try {
    if (typeof window.loadEquipments === 'function') {
      window.equipments = window.loadEquipments();
      if (!Array.isArray(window.equipments)) {
        console.warn('window.equipments não é um array. Inicializando como vazio.');
        window.equipments = [];
      }
      console.log('window.equipments carregado:', window.equipments);
    } else {
      console.error('window.loadEquipments não está definido.');
      window.equipments = [];
      window.showError('Erro: função de carregamento de equipamentos não encontrada.');
    }
  } catch (e) {
    console.error('Erro ao carregar equipamentos:', e.message);
    window.equipments = [];
    window.showError('Erro ao carregar equipamentos.');
  }

  // Renderizar listas
  try {
    renderUserList();
    renderEquipmentList();
    renderEventList();
  } catch (e) {
    console.error('Erro ao renderizar listas:', e.message);
    window.showError('Erro ao renderizar conteúdo da página.');
  }

  // Configurar formulário para alterar dados do desenvolvedor
  try {
    const profileForm = document.getElementById('developer-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          updateDeveloperProfile();
        } catch (e) {
          console.error('Erro ao atualizar dados do desenvolvedor:', e.message);
          window.showError('Erro ao atualizar dados do desenvolvedor.');
        }
      });
    } else {
      console.error('Formulário developer-profile-form não encontrado.');
      window.showError('Erro interno: formulário de perfil não encontrado.');
    }
  } catch (e) {
    console.error('Erro ao configurar formulário de perfil:', e.message);
    window.showError('Erro ao configurar formulário de perfil.');
  }

  // Configurar formulário de cadastro de usuário
  try {
    const userForm = document.getElementById('user-form');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const editUsername = document.getElementById('edit-username')?.value;
          const username = document.getElementById('username')?.value?.trim();
          const password = document.getElementById('password')?.value?.trim();
          const userType = document.getElementById('user-type')?.value;
          if (editUsername) {
            // Editar usuário
            if (window.editUser(editUsername, username, password, userType)) {
              resetUserForm();
            }
          } else {
            // Cadastrar usuário
            if (window.registerUser(username, password, userType)) {
              resetUserForm();
            }
          }
          renderUserList();
        } catch (e) {
          console.error('Erro ao processar formulário de usuário:', e.message);
          window.showError('Erro ao processar formulário de usuário.');
        }
      });
    } else {
      console.error('Formulário user-form não encontrado.');
      window.showError('Erro interno: formulário de usuário não encontrado.');
    }
  } catch (e) {
    console.error('Erro ao configurar formulário de usuário:', e.message);
    window.showError('Erro ao configurar formulário de usuário.');
  }

  // Configurar botão de cancelar edição
  try {
    const cancelEditButton = document.getElementById('cancel-edit');
    if (cancelEditButton) {
      cancelEditButton.addEventListener('click', resetUserForm);
    }
  } catch (e) {
    console.error('Erro ao configurar botão de cancelar:', e.message);
    window.showError('Erro ao configurar botão de cancelar.');
  }

  // Configurar formulário de cadastro de equipamento
  try {
    const equipmentForm = document.getElementById('equipment-form');
    if (equipmentForm) {
      equipmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          registerEquipment();
        } catch (e) {
          console.error('Erro ao processar formulário de equipamento:', e.message);
          window.showError('Erro ao processar formulário de equipamento.');
        }
      });
    } else {
      console.error('Formulário equipment-form não encontrado.');
      window.showError('Erro interno: formulário de equipamento não encontrado.');
    }
  } catch (e) {
    console.error('Erro ao configurar formulário de equipamento:', e.message);
    window.showError('Erro ao configurar formulário de equipamento.');
  }
});

// Função para atualizar dados do desenvolvedor logado
function updateDeveloperProfile() {
  console.log('Atualizando dados do desenvolvedor...');
  const currentUsername = localStorage.getItem('userName');
  const newUsername = document.getElementById('developer-username')?.value?.trim();
  const newPassword = document.getElementById('developer-password')?.value?.trim();

  if (!currentUsername) {
    window.showError('Usuário não está logado.');
    return;
  }

  if (!newUsername || !newPassword) {
    window.showError('Novo usuário e senha são obrigatórios.');
    return;
  }

  const userType = localStorage.getItem('userType') || 'developer';
  if (window.editUser(currentUsername, newUsername, newPassword, userType)) {
    console.log('Dados do desenvolvedor atualizados com sucesso.');
    localStorage.setItem('userName', newUsername);
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = newUsername;
    document.getElementById('developer-profile-form')?.reset();
  }
}

function resetUserForm() {
  console.log('Resetando formulário de usuário.');
  try {
    const userForm = document.getElementById('user-form');
    const editUsername = document.getElementById('edit-username');
    const submitButton = document.getElementById('submit-user');
    const cancelEditButton = document.getElementById('cancel-edit');
    if (userForm && editUsername && submitButton && cancelEditButton) {
      userForm.reset();
      editUsername.value = '';
      submitButton.textContent = 'Cadastrar Usuário';
      cancelEditButton.classList.add('hidden');
    } else {
      console.error('Elementos do formulário de usuário não encontrados.');
      window.showError('Erro ao resetar formulário de usuário.');
    }
  } catch (e) {
    console.error('Erro ao resetar formulário:', e.message);
    window.showError('Erro ao resetar formulário.');
  }
}

function renderUserList() {
  console.log('Renderizando lista de usuários...');
  try {
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) {
      console.error('Elemento user-table-body não encontrado.');
      window.showError('Erro ao renderizar lista de usuários.');
      return;
    }
    tableBody.innerHTML = '';
    const users = window.loadUsers();
    if (!users || !Array.isArray(users) || users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-600 py-4">Nenhum usuário registrado.</td></tr>';
      console.log('Nenhum usuário para renderizar.');
      return;
    }

    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-4 py-2 border">${window.escapeHtml(user.username)}</td>
        <td class="px-4 py-2 border">${window.escapeHtml(user.userType)}</td>
        <td class="px-4 py-2 border">
          <button onclick="editUser('${window.escapeHtml(user.username)}')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2">Editar</button>
          <button onclick="deleteUser('${window.escapeHtml(user.username)}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Excluir</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    console.log('Lista de usuários renderizada com', users.length, 'itens.');
  } catch (e) {
    console.error('Erro ao renderizar lista de usuários:', e.message);
    window.showError('Erro ao renderizar lista de usuários.');
  }
}

function editUser(username) {
  console.log('Editando usuário:', username);
  try {
    const users = window.loadUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
      window.showError('Usuário não encontrado.');
      return;
    }

    document.getElementById('edit-username').value = user.username;
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = ''; // Não preenche a senha por segurança
    document.getElementById('user-type').value = user.userType;

    const submitButton = document.getElementById('submit-user');
    const cancelEditButton = document.getElementById('cancel-edit');
    if (submitButton && cancelEditButton) {
      submitButton.textContent = 'Atualizar Usuário';
      cancelEditButton.classList.remove('hidden');
    } else {
      console.error('Botões do formulário não encontrados.');
      window.showError('Erro ao preparar formulário de edição.');
    }
  } catch (e) {
    console.error('Erro ao editar usuário:', e.message);
    window.showError('Erro ao editar usuário.');
  }
}

function deleteUser(username) {
  console.log('Iniciando exclusão de usuário:', username);
  try {
    if (window.deleteUser(username)) {
      renderUserList();
    }
  } catch (e) {
    console.error('Erro ao excluir usuário:', e.message);
    window.showError('Erro ao excluir usuário.');
  }
}

function clearAllEquipmentHistory() {
  console.log('Zerando histórico total de eventos...');
  try {
    if (confirm('Tem certeza que deseja zerar o histórico total de eventos de todos os equipamentos?')) {
      window.equipments.forEach(eq => {
        eq.history = [];
      });
      window.saveEquipments(window.equipments);
      window.showSuccess('Histórico total zerado com sucesso.');
      renderEventList();
    }
  } catch (e) {
    console.error('Erro ao zerar histórico total:', e.message);
    window.showError('Erro ao zerar histórico total.');
  }
}

function toggleSelectAllEvents() {
  const selectAllCheckbox = document.getElementById('select-all-events');
  const eventCheckboxes = document.querySelectorAll('.event-checkbox');
  eventCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });
}

function deleteSelectedEvents() {
  console.log('Apagando eventos selecionados...');
  try {
    const eventCheckboxes = document.querySelectorAll('.event-checkbox:checked');
    if (eventCheckboxes.length === 0) {
      window.showError('Nenhum evento selecionado para apagar.');
      return;
    }
    if (confirm(`Tem certeza que deseja apagar ${eventCheckboxes.length} evento(s) selecionado(s)?`)) {
      eventCheckboxes.forEach(checkbox => {
        const [equipmentId, eventIndex] = checkbox.value.split('-').map(Number);
        const equipment = window.equipments.find(eq => eq.id === equipmentId);
        if (equipment && equipment.history[eventIndex]) {
          equipment.history.splice(eventIndex, 1);
        }
      });
      window.saveEquipments(window.equipments);
      window.showSuccess('Eventos selecionados apagados com sucesso.');
      renderEventList();
    }
  } catch (e) {
    console.error('Erro ao apagar eventos selecionados:', e.message);
    window.showError('Erro ao apagar eventos selecionados.');
  }
}

function deleteEvent(equipmentId, eventIndex) {
  console.log('Apagando evento:', { equipmentId, eventIndex });
  try {
    if (confirm('Tem certeza que deseja apagar este evento?')) {
      const equipment = window.equipments.find(eq => eq.id === equipmentId);
      if (equipment && equipment.history[eventIndex]) {
        equipment.history.splice(eventIndex, 1);
        window.saveEquipments(window.equipments);
        window.showSuccess('Evento apagado com sucesso.');
        renderEventList();
      } else {
        window.showError('Evento não encontrado.');
      }
    }
  } catch (e) {
    console.error('Erro ao apagar evento:', e.message);
    window.showError('Erro ao apagar evento.');
  }
}

function deleteEquipmentHistory(equipmentId) {
  console.log('Apagando histórico do equipamento:', equipmentId);
  try {
    if (confirm('Tem certeza que deseja apagar todo o histórico deste equipamento?')) {
      const equipment = window.equipments.find(eq => eq.id === equipmentId);
      if (equipment) {
        equipment.history = [];
        window.saveEquipments(window.equipments);
        window.showSuccess('Histórico do equipamento apagado com sucesso.');
        renderEventList();
      } else {
        window.showError('Equipamento não encontrado.');
      }
    }
  } catch (e) {
    console.error('Erro ao apagar histórico do equipamento:', e.message);
    window.showError('Erro ao apagar histórico do equipamento.');
  }
}

function editEvent(equipmentId, eventIndex) {
  console.log('Editando evento:', { equipmentId, eventIndex });
  try {
    const equipment = window.equipments.find(eq => eq.id === equipmentId);
    if (!equipment || !equipment.history[eventIndex]) {
      window.showError('Evento não encontrado.');
      return;
    }
    const event = equipment.history[eventIndex];

    // Criar um formulário de edição dinâmico
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 class="text-lg font-semibold mb-4">Editar Evento</h2>
        <form id="edit-event-form" class="space-y-4">
          <div>
            <label for="event-timestamp" class="block text-sm font-medium text-gray-700">Data/Hora (YYYY-MM-DD HH:MM:SS)</label>
            <input type="datetime-local" id="event-timestamp" value="${new Date(event.timestamp).toISOString().slice(0, 16)}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
          </div>
          <div>
            <label for="event-status" class="block text-sm font-medium text-gray-700">Status</label>
            <select id="event-status" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
              <option value="Disponível" ${event.status === 'Disponível' ? 'selected' : ''}>Disponível</option>
              <option value="Indisponível" ${event.status === 'Indisponível' ? 'selected' : ''}>Indisponível</option>
              <option value="Manutenção" ${event.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
              <option value="Inspeção" ${event.status === 'Inspeção' ? 'selected' : ''}>Inspeção</option>
            </select>
          </div>
          <div>
            <label for="event-details" class="block text-sm font-medium text-gray-700">Detalhes</label>
            <textarea id="event-details" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">${event.details || ''}</textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600">Cancelar</button>
            <button type="submit" class="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600">Salvar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const editEventForm = document.getElementById('edit-event-form');
    editEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const timestamp = new Date(document.getElementById('event-timestamp').value).toISOString();
        const status = document.getElementById('event-status').value;
        const details = document.getElementById('event-details').value.trim();

        equipment.history[eventIndex] = { timestamp, status, details };
        window.saveEquipments(window.equipments);
        window.showSuccess('Evento atualizado com sucesso.');
        modal.remove();
        renderEventList();
      } catch (error) {
        console.error('Erro ao salvar evento editado:', error.message);
        window.showError('Erro ao salvar evento editado.');
      }
    });
  } catch (e) {
    console.error('Erro ao editar evento:', e.message);
    window.showError('Erro ao editar evento.');
  }
}

function renderEventList() {
  console.log('Renderizando lista de equipamentos...');
  try {
    const tableBody = document.getElementById('equipment-table-body');
    if (!tableBody) {
      console.error('Elemento equipment-table-body não encontrado.');
      window.showError('Erro ao renderizar lista de equipamentos.');
      return;
    }
    tableBody.innerHTML = '';
    if (!Array.isArray(window.equipments) || window.equipments.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-600 py-4">Nenhum equipamento registrado.</td></tr>';
      console.log('Nenhum equipamento para renderizar.');
      return;
    }

    window.equipments.forEach(eq => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-4 py-2 border">${window.escapeHtml(eq.name)}</td>
        <td class="px-4 py-2 border">${window.escapeHtml(eq.type)}</td>
        <td class="px-4 py-2 border">${window.escapeHtml(eq.manufacturer || 'N/A')}</td>
        <td class="px-4 py-2 border">${eq.hourmeter || 0} h</td>
        <td class="px-4 py-2 border">
          <button onclick="editEquipment(${eq.id})" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Editar</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    console.log('Lista de equipamentos renderizada com', window.equipments.length, 'itens.');
  } catch (e) {
    console.error('Erro ao renderizar lista de equipamentos:', e.message);
    window.showError('Erro ao renderizar lista de equipamentos.');
  }
}

function editEquipment(equipmentId) {
  console.log('Editando equipamento ID:', equipmentId);
  try {
    const equipment = window.equipments.find(eq => eq.id === equipmentId);
    if (!equipment) {
      window.showError('Equipamento não encontrado.');
      return;
    }

    document.getElementById('equipment-name').value = equipment.name;
    document.getElementById('equipment-type').value = equipment.type;
    document.getElementById('equipment-manufacturer').value = equipment.manufacturer || '';
    document.getElementById('equipment-hourmeter').value = equipment.hourmeter || 0;
    document.getElementById('equipment-details').value = equipment.details || '';

    const form = document.getElementById('equipment-form');
    const submitButton = form?.querySelector('button[type="submit"]');
    if (form && submitButton) {
      submitButton.textContent = 'Atualizar Equipamento';
      form.onsubmit = (e) => {
        e.preventDefault();
        try {
          registerEquipment(equipmentId);
          form.reset();
          submitButton.textContent = 'Cadastrar Equipamento';
          form.onsubmit = (e) => {
            e.preventDefault();
            registerEquipment();
          };
        } catch (e) {
          console.error('Erro ao atualizar equipamento:', e.message);
          window.showError('Erro ao atualizar equipamento.');
        }
      };
    } else {
      console.error('Formulário ou botão de equipamento não encontrados.');
      window.showError('Erro ao preparar formulário de edição.');
    }
  } catch (e) {
    console.error('Erro ao editar equipamento:', e.message);
    window.showError('Erro ao editar equipamento.');
  }
}

function registerEquipment(equipmentId = null) {
  console.log('Registrando equipamento, ID:', equipmentId);
  try {
    const name = document.getElementById('equipment-name')?.value?.trim();
    const type = document.getElementById('equipment-type')?.value?.trim();
    const manufacturer = document.getElementById('equipment-manufacturer')?.value?.trim();
    const hourmeter = document.getElementById('equipment-hourmeter')?.value;
    const details = document.getElementById('equipment-details')?.value?.trim();

    if (!name || !type || !manufacturer || !hourmeter) {
      window.showError('Os campos Nome, Tipo, Fabricante e Horímetro são obrigatórios.');
      return;
    }
    const hourmeterValue = parseFloat(hourmeter);
    if (isNaN(hourmeterValue) || hourmeterValue < 0) {
      window.showError('Horímetro deve ser um número não negativo.');
      return;
    }

    if (!Array.isArray(window.equipments)) {
      console.warn('window.equipments não é um array. Inicializando como vazio.');
      window.equipments = [];
    }

    if (equipmentId) {
      // Editar equipamento existente
      const equipment = window.equipments.find(eq => eq.id === equipmentId);
      if (!equipment) {
        window.showError('Equipamento não encontrado.');
        return;
      }
      equipment.name = name;
      equipment.type = type;
      equipment.manufacturer = manufacturer;
      equipment.hourmeter = hourmeterValue;
      equipment.details = details || '';
      window.showSuccess('Equipamento atualizado com sucesso.');
    } else {
      // Criar novo equipamento
      const maxId = window.equipments.length > 0 ? Math.max(...window.equipments.map(eq => eq.id)) : 0;
      const newEquipment = {
        id: maxId + 1,
        name,
        type,
        manufacturer,
        hourmeter: hourmeterValue,
        details: details || '',
        status: 'Disponível',
        history: []
      };
      window.equipments.push(newEquipment);
      window.showSuccess('Equipamento cadastrado com sucesso.');
    }

    window.saveEquipments(window.equipments);
    document.getElementById('equipment-form')?.reset();
    renderEquipmentList();
    // Atualizar o filtro de equipamentos no histórico
    const equipmentFilter = document.getElementById('equipment-filter-history');
    if (equipmentFilter) {
      equipmentFilter.innerHTML = '<option value="">Todos os Equipamentos</option>';
      window.equipments.forEach(eq => {
        const option = document.createElement('option');
        option.value = eq.id;
        option.textContent = eq.name;
        equipmentFilter.appendChild(option);
      });
    }
    renderEventList();
  } catch (e) {
    console.error('Erro ao registrar equipamento:', e.message);
    window.showError('Erro ao registrar equipamento.');
  }
}
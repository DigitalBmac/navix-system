window.escapeHtml = function(str) {
  if (typeof str !== 'string') {
    console.warn('escapeHtml: Input não é uma string:', str);
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

window.showError = function(message) {
  console.error('Erro:', message);
  const errorDiv = document.getElementById('error-message');
  if (errorDiv && typeof errorDiv.textContent !== 'undefined') {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
      const currentErrorDiv = document.getElementById('error-message');
      if (currentErrorDiv) {
        currentErrorDiv.classList.add('hidden');
      }
    }, 5000);
  } else {
    console.warn('Elemento error-message não encontrado ou inválido. Mensagem:', message);
  }
};

window.showSuccess = function(message) {
  console.log('Sucesso:', message);
  const successDiv = document.getElementById('success-message');
  if (successDiv && typeof successDiv.textContent !== 'undefined') {
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => {
      const currentSuccessDiv = document.getElementById('success-message');
      if (currentSuccessDiv) {
        currentSuccessDiv.classList.add('hidden');
      }
    }, 5000);
  } else {
    console.warn('Elemento success-message não encontrado ou inválido. Mensagem:', message);
  }
};

// Função de hash simples para demonstração (não segura para produção)
window.simpleHash = function(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
};

// Inicializar o cliente Supabase
const SUPABASE_URL = 'https://mujgtrzyagogkmnytpkm.supabase.co'; // Substitua com sua URL do Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amd0cnp5YWdvZ2ttbnl0cGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjcyMjAsImV4cCI6MjA2MzUwMzIyMH0.FrJsprljWpqLnk-q4_ponLzzfZ3svnwabDyp8DRAeaQ'; // Substitua com sua chave pública do Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.loadUsers = function() {
  try {
    const users = localStorage.getItem('users');
    if (!users) {
      console.log('Nenhum usuário encontrado no localStorage. Retornando array vazio.');
      return [];
    }
    const parsedUsers = JSON.parse(users);
    if (!Array.isArray(parsedUsers)) {
      console.warn('loadUsers: users não é um array. Inicializando como vazio.');
      localStorage.setItem('users', JSON.stringify([]));
      return [];
    }
    console.log('Usuários carregados:', parsedUsers);
    return parsedUsers;
  } catch (e) {
    console.error('Erro ao carregar usuários:', e.message);
    window.showError('Erro ao carregar usuários. Dados resetados.');
    localStorage.setItem('users', JSON.stringify([]));
    return [];
  }
};

window.saveUsers = function(users) {
  try {
    if (!Array.isArray(users)) {
      console.warn('saveUsers: users não é um array. Inicializando como vazio.');
      users = [];
    }
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Usuários salvos:', users);
    return true;
  } catch (e) {
    console.error('Erro ao salvar usuários:', e.message);
    window.showError('Erro ao salvar usuários.');
    return false;
  }
};

window.registerUser = function(username, password, userType) {
  console.log('Registrando usuário:', username, userType);
  try {
    if (!username || !password || !userType) {
      console.error('registerUser: Campos obrigatórios faltando:', { username, password, userType });
      window.showError('Todos os campos (usuário, senha, tipo) são obrigatórios.');
      return false;
    }
    if (!['operacao', 'admin', 'developer'].includes(userType)) {
      console.error('registerUser: Tipo de usuário inválido:', userType);
      window.showError('Tipo de usuário inválido. Use "operacao", "admin" ou "developer".');
      return false;
    }
    const users = window.loadUsers();
    if (users.some(user => user.username === username)) {
      console.warn('registerUser: Usuário já existe:', username);
      window.showError('Usuário já existe.');
      return false;
    }
    const hashedPassword = window.simpleHash(password);
    console.log('registerUser: Senha hasheada:', hashedPassword);
    users.push({ username, password: hashedPassword, userType });
    if (window.saveUsers(users)) {
      console.log('registerUser: Usuário registrado com sucesso:', { username, userType, hashedPassword });
      window.showSuccess('Usuário registrado com sucesso.');
      return true;
    }
    console.error('registerUser: Falha ao salvar usuários.');
    window.showError('Falha ao salvar usuários.');
    return false;
  } catch (e) {
    console.error('Erro em registerUser:', e.message);
    window.showError('Erro ao registrar usuário.');
    return false;
  }
};

window.loginUser = function(username, password) {
  console.log('Tentando login de usuário:', username);
  try {
    if (!username || !password) {
      console.error('loginUser: Usuário ou senha não fornecidos.');
      window.showError('Usuário e senha são obrigatórios.');
      return false;
    }
    let users = window.loadUsers();
    if (users.length === 0) {
      console.log('Nenhum usuário registrado. Inicializando com usuário padrão.');
      const success = window.registerUser('admin', 'admin123', 'admin');
      if (!success) {
        console.error('loginUser: Falha ao inicializar usuário padrão.');
        window.showError('Falha ao inicializar usuário padrão.');
        return false;
      }
      users = window.loadUsers();
      console.log('loginUser: Usuários após inicialização:', users);
    }
    const hashedPassword = window.simpleHash(password);
    console.log('loginUser: Senha fornecida (hasheada):', hashedPassword);
    const user = users.find(u => u.username === username && u.password === hashedPassword);
    if (user) {
      console.log('loginUser: Usuário encontrado:', user);
      localStorage.setItem('userName', user.username);
      localStorage.setItem('userType', user.userType);
      console.log('loginUser: Valores salvos no localStorage:', { userName: user.username, userType: user.userType });
      console.log('Login bem-sucedido:', user);
      window.showSuccess('Login bem-sucedido.');
      return true;
    }
    console.warn('loginUser: Usuário ou senha inválidos:', username);
    window.showError('Usuário ou senha inválidos.');
    return false;
  } catch (e) {
    console.error('Erro em loginUser:', e.message);
    window.showError('Erro ao fazer login.');
    return false;
  }
};

window.editUser = function(oldUsername, newUsername, password, userType) {
  console.log('Editando usuário:', oldUsername, 'para:', newUsername);
  try {
    if (!oldUsername || !newUsername || !password || !userType) {
      console.error('editUser: Campos obrigatórios faltando:', { oldUsername, newUsername, password, userType });
      window.showError('Todos os campos (usuário, senha, tipo) são obrigatórios.');
      return false;
    }
    if (!['operacao', 'admin', 'developer'].includes(userType)) {
      console.error('editUser: Tipo de usuário inválido:', userType);
      window.showError('Tipo de usuário inválido.');
      return false;
    }
    const users = window.loadUsers();
    const userIndex = users.findIndex(user => user.username === oldUsername);
    if (userIndex === -1) {
      console.warn('editUser: Usuário não encontrado:', oldUsername);
      window.showError('Usuário não encontrado.');
      return false;
    }
    if (newUsername !== oldUsername && users.some(user => user.username === newUsername)) {
      console.warn('editUser: Novo nome de usuário já existe:', newUsername);
      window.showError('Novo nome de usuário já existe.');
      return false;
    }
    const hashedPassword = window.simpleHash(password);
    console.log('editUser: Senha hasheada:', hashedPassword);
    users[userIndex] = { username: newUsername, password: hashedPassword, userType };
    if (window.saveUsers(users)) {
      if (oldUsername === localStorage.getItem('userName')) {
        localStorage.setItem('userName', newUsername);
        localStorage.setItem('userType', userType);
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) userNameElement.textContent = newUsername;
      }
      console.log('editUser: Usuário atualizado com sucesso:', { newUsername, userType });
      window.showSuccess('Usuário atualizado com sucesso.');
      return true;
    }
    console.error('editUser: Falha ao salvar usuários.');
    return false;
  } catch (e) {
    console.error('Erro em editUser:', e.message);
    window.showError('Erro ao editar usuário.');
    return false;
  }
};

window.deleteUser = function(username) {
  console.log('Excluindo usuário:', username);
  try {
    const currentUser = localStorage.getItem('userName');
    if (username === currentUser) {
      console.warn('deleteUser: Tentativa de excluir usuário logado:', username);
      window.showError('Não é possível excluir o usuário atualmente logado.');
      return false;
    }
    const users = window.loadUsers();
    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex === -1) {
      console.warn('deleteUser: Usuário não encontrado:', username);
      window.showError('Usuário não encontrado.');
      return false;
    }
    users.splice(userIndex, 1);
    if (window.saveUsers(users)) {
      console.log('deleteUser: Usuário excluído com sucesso:', username);
      window.showSuccess('Usuário excluído com sucesso.');
      return true;
    }
    console.error('deleteUser: Falha ao salvar usuários após exclusão.');
    return false;
  } catch (e) {
    console.error('Erro em deleteUser:', e.message);
    window.showError('Erro ao excluir usuário.');
    return false;
  }
};

window.loginDeveloper = function(username, password) {
  console.log('Tentando login como desenvolvedor:', username);
  try {
    if (!username || !password) {
      console.error('loginDeveloper: Usuário ou senha não fornecidos.');
      window.showError('Usuário e senha são obrigatórios.');
      return false;
    }
    let users = window.loadUsers();
    console.log('loginDeveloper: Usuários carregados:', users);

    // Verificar se o usuário "dev" existe, caso contrário, criá-lo
    const devUser = users.find(u => u.username === 'dev');
    if (!devUser) {
      console.log('Usuário "dev" não encontrado. Inicializando com usuário padrão "dev".');
      const success = window.registerUser('dev', 'dev123', 'developer');
      if (!success) {
        console.error('loginDeveloper: Falha ao inicializar usuário padrão "dev".');
        window.showError('Falha ao inicializar usuário padrão.');
        return false;
      }
      users = window.loadUsers();
      console.log('loginDeveloper: Usuários após inicialização:', users);
    }

    const hashedPassword = window.simpleHash(password);
    console.log('loginDeveloper: Senha fornecida (hasheada):', hashedPassword);
    const user = users.find(u => {
      const matchesUsername = u.username === username;
      const matchesPassword = u.password === hashedPassword;
      console.log('loginDeveloper: Verificando usuário:', {
        username: u.username,
        passwordMatch: matchesPassword,
        storedPassword: u.password
      });
      return matchesUsername && matchesPassword;
    });
    if (user) {
      console.log('loginDeveloper: Usuário encontrado:', user);
      try {
        localStorage.setItem('devToken', 'authenticated');
        localStorage.setItem('userName', user.username);
        localStorage.setItem('userType', user.userType);
        console.log('loginDeveloper: Valores salvos no localStorage:', {
          devToken: localStorage.getItem('devToken'),
          userName: localStorage.getItem('userName'),
          userType: localStorage.getItem('userType')
        });
        console.log('Login de desenvolvedor bem-sucedido:', user);
        window.showSuccess('Login de desenvolvedor bem-sucedido.');
        return true;
      } catch (e) {
        console.error('Erro ao salvar devToken:', e.message);
        window.showError('Erro ao salvar token de desenvolvedor.');
        return false;
      }
    }
    console.warn('loginDeveloper: Usuário ou senha inválidos:', username);
    window.showError('Usuário ou senha inválidos.');
    return false;
  } catch (e) {
    console.error('Erro em loginDeveloper:', e.message);
    window.showError('Erro ao fazer login como desenvolvedor.');
    return false;
  }
};

window.isDeveloperAuthenticated = function() {
  try {
    const token = localStorage.getItem('devToken');
    const isAuthenticated = token === 'authenticated';
    console.log('Verificando autenticação desenvolvedor:', { token, isAuthenticated });
    if (!isAuthenticated) {
      console.log('Autenticação falhou. Token inválido.');
      if (!token) console.log('Token ausente no localStorage.');
    }
    return isAuthenticated;
  } catch (e) {
    console.error('Erro em isDeveloperAuthenticated:', e.message);
    return false;
  }
};

window.logoutDeveloper = function() {
  console.log('Deslogando desenvolvedor...');
  try {
    localStorage.removeItem('devToken');
    console.log('devToken removido.');
    return true;
  } catch (e) {
    console.error('Erro em logoutDeveloper:', e.message);
    window.showError('Erro ao deslogar desenvolvedor.');
    return false;
  }
};

// Funções para interagir com o Supabase
window.loadEquipments = async function() {
  try {
    const { data, error } = await supabase
      .from('equipments')
      .select('*');
    
    if (error) {
      console.error('Erro ao carregar equipamentos do Supabase:', error.message);
      window.showError('Erro ao carregar equipamentos do Supabase.');
      return [];
    }

    console.log('Equipamentos carregados do Supabase:', data);
    return data || [];
  } catch (e) {
    console.error('Erro ao carregar equipamentos:', e.message);
    window.showError('Erro ao carregar equipamentos. Dados resetados.');
    return [];
  }
};

window.saveEquipments = async function(equipments) {
  try {
    // Primeiro, deletar todos os equipamentos existentes
    const { error: deleteError } = await supabase
      .from('equipments')
      .delete()
      .neq('id', -1); // Condição impossível para deletar tudo

    if (deleteError) {
      console.error('Erro ao deletar equipamentos existentes:', deleteError.message);
      window.showError('Erro ao salvar equipamentos no Supabase.');
      return false;
    }

    // Inserir os novos equipamentos
    const { error: insertError } = await supabase
      .from('equipments')
      .insert(equipments);

    if (insertError) {
      console.error('Erro ao salvar equipamentos no Supabase:', insertError.message);
      window.showError('Erro ao salvar equipamentos no Supabase.');
      return false;
    }

    console.log('Equipamentos salvos no Supabase:', equipments);
    return true;
  } catch (e) {
    console.error('Erro ao salvar equipamentos:', e.message);
    window.showError('Erro ao salvar equipamentos.');
    return false;
  }
};

// Função para carregar o histórico de um equipamento
window.loadEquipmentHistory = async function(equipmentId) {
  try {
    const { data, error } = await supabase
      .from('equipment_history')
      .select('*')
      .eq('equipment_id', equipmentId);

    if (error) {
      console.error('Erro ao carregar histórico do equipamento:', error.message);
      window.showError('Erro ao carregar histórico do equipamento.');
      return [];
    }

    console.log('Histórico carregado do Supabase:', data);
    return data || [];
  } catch (e) {
    console.error('Erro ao carregar histórico:', e.message);
    window.showError('Erro ao carregar histórico.');
    return [];
  }
};

// Função para salvar o histórico de um equipamento
window.saveEquipmentHistory = async function(equipmentId, history) {
  try {
    // Deletar o histórico existente para o equipamento
    const { error: deleteError } = await supabase
      .from('equipment_history')
      .delete()
      .eq('equipment_id', equipmentId);

    if (deleteError) {
      console.error('Erro ao deletar histórico existente:', deleteError.message);
      window.showError('Erro ao salvar histórico no Supabase.');
      return false;
    }

    // Inserir o novo histórico
    const historyWithEquipmentId = history.map(event => ({
      ...event,
      equipment_id: equipmentId
    }));
    const { error: insertError } = await supabase
      .from('equipment_history')
      .insert(historyWithEquipmentId);

    if (insertError) {
      console.error('Erro ao salvar histórico no Supabase:', insertError.message);
      window.showError('Erro ao salvar histórico no Supabase.');
      return false;
    }

    console.log('Histórico salvo no Supabase:', historyWithEquipmentId);
    return true;
  } catch (e) {
    console.error('Erro ao salvar histórico:', e.message);
    window.showError('Erro ao salvar histórico.');
    return false;
  }
};

// Função para carregar notificações
window.loadNotifications = async function() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*');

    if (error) {
      console.error('Erro ao carregar notificações do Supabase:', error.message);
      window.showError('Erro ao carregar notificações do Supabase.');
      return [];
    }

    console.log('Notificações carregadas do Supabase:', data);
    return data || [];
  } catch (e) {
    console.error('Erro ao carregar notificações:', e.message);
    window.showError('Erro ao carregar notificações.');
    return [];
  }
};

// Função para salvar notificações
window.saveNotifications = async function(notifications) {
  try {
    // Deletar todas as notificações existentes
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', ''); // Condição impossível para deletar tudo

    if (deleteError) {
      console.error('Erro ao deletar notificações existentes:', deleteError.message);
      window.showError('Erro ao salvar notificações no Supabase.');
      return false;
    }

    // Inserir as novas notificações
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Erro ao salvar notificações no Supabase:', insertError.message);
      window.showError('Erro ao salvar notificações no Supabase.');
      return false;
    }

    console.log('Notificações salvas no Supabase:', notifications);
    return true;
  } catch (e) {
    console.error('Erro ao salvar notificações:', e.message);
    window.showError('Erro ao salvar notificações.');
    return false;
  }
};

window.logout = function() {
  console.log('Realizando logout...');
  try {
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    console.log('Redirecionando para index.html');
    window.location.href = 'index.html';
    return true;
  } catch (e) {
    console.error('Erro ao fazer logout:', e.message);
    window.showError('Erro ao fazer logout.');
    return false;
  }
};
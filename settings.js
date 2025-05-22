document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando settings.js');

  // Verificar elementos essenciais
  const userNameElement = document.getElementById('user-name');
  const alertSettingsForm = document.getElementById('alert-settings-form');
  const downtimeThresholdInput = document.getElementById('downtime-threshold');
  const maintenanceThresholdInput = document.getElementById('maintenance-threshold');
  const maintenanceDurationThresholdInput = document.getElementById('maintenance-duration-threshold');
  const inspectionDurationThresholdInput = document.getElementById('inspection-duration-threshold');

  if (!userNameElement || !alertSettingsForm || !downtimeThresholdInput || 
      !maintenanceThresholdInput || !maintenanceDurationThresholdInput || 
      !inspectionDurationThresholdInput) {
    console.error('Elementos essenciais não encontrados:', {
      userNameElement, alertSettingsForm, downtimeThresholdInput,
      maintenanceThresholdInput, maintenanceDurationThresholdInput,
      inspectionDurationThresholdInput
    });
    window.showError('Erro interno: elementos essenciais não encontrados.');
    return;
  }

  // Verificar login
  const userName = localStorage.getItem('userName'); // Corrigido de 'userSettings' para 'userName'
  const userType = localStorage.getItem('userType');
  if (!userName || !userType) {
    console.log('Usuário não logado. Redirecionando para index.html');
    window.location.href = 'index.html';
    return;
  }
  userNameElement.textContent = `${userName} (${userType})`;

  // Carregar configurações de alertas
  const loadAlertSettings = () => {
    const settings = localStorage.getItem('alertSettings');
    if (!settings) {
      const defaultSettings = {
        downtimeThreshold: 24, // Horas
        maintenanceThreshold: 30, // Dias
        maintenanceDurationThreshold: 48, // Horas
        inspectionDurationThreshold: 48 // Horas
      };
      localStorage.setItem('alertSettings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(settings);
  };

  // Preencher formulário com configurações atuais
  const populateForm = () => {
    const settings = loadAlertSettings();
    downtimeThresholdInput.value = settings.downtimeThreshold;
    maintenanceThresholdInput.value = settings.maintenanceThreshold;
    maintenanceDurationThresholdInput.value = settings.maintenanceDurationThreshold;
    inspectionDurationThresholdInput.value = settings.inspectionDurationThreshold;
  };

  // Salvar configurações
  const saveSettings = () => {
    const settings = {
      downtimeThreshold: parseInt(downtimeThresholdInput.value),
      maintenanceThreshold: parseInt(maintenanceThresholdInput.value),
      maintenanceDurationThreshold: parseInt(maintenanceDurationThresholdInput.value),
      inspectionDurationThreshold: parseInt(inspectionDurationThresholdInput.value)
    };

    if (isNaN(settings.downtimeThreshold) || settings.downtimeThreshold < 1 ||
        isNaN(settings.maintenanceThreshold) || settings.maintenanceThreshold < 1 ||
        isNaN(settings.maintenanceDurationThreshold) || settings.maintenanceDurationThreshold < 1 ||
        isNaN(settings.inspectionDurationThreshold) || settings.inspectionDurationThreshold < 1) {
      window.showError('Todos os valores devem ser números positivos.');
      return false;
    }

    localStorage.setItem('alertSettings', JSON.stringify(settings));
    return true;
  };

  // Função para restaurar configurações padrão
  window.resetSettings = function() {
    localStorage.removeItem('alertSettings');
    populateForm();
    window.showSuccess('Configurações restauradas para os valores padrão.');
  };

  // Configurar formulário
  alertSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (saveSettings()) {
      window.showSuccess('Configurações salvas com sucesso.');
    }
  });

  // Inicializar a página
  try {
    populateForm();
  } catch (e) {
    console.error('Erro ao inicializar settings:', e.message);
    window.showError('Erro ao inicializar configurações.');
  }
});
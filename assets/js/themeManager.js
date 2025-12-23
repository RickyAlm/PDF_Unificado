// Gerenciador de Tema
class ThemeManager {
  constructor() {
    this.themeKey = 'pdf-unificado-theme';
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
    this.setupToggleButton();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem(this.themeKey);
    if (savedTheme) {
      return savedTheme;
    }

    // Verifica a preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  saveTheme(theme) {
    localStorage.setItem(this.themeKey, theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.updateToggleIcon();
    this.configureSwal();
    this.updateCardShadow(theme);
  }

  updateCardShadow(theme) {
    const card = document.querySelector('.card');
    if (card) {
      if (theme === 'light') {
        card.classList.add('shadow-lg');
      } else {
        card.classList.remove('shadow-lg');
      }
    }
  }

  configureSwal() {
    if (typeof Swal === 'undefined') return;

    const isDark = this.currentTheme === 'dark';

    // Configuração padrão do SweetAlert2 baseada no tema
    const swalDefaults = isDark ? {
      background: '#2d2d2d',
      color: '#e9ecef',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-html',
        input: 'swal-dark-input',
        actions: 'swal-dark-actions'
      }
    } : {
      background: '#ffffff',
      color: '#212529',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    };

    // Aplica configuração padrão
    Swal.mixin(swalDefaults).fire = Swal.fire;
  }

  getSwalConfig(userConfig = {}) {
    const isDark = this.currentTheme === 'dark';

    const baseConfig = isDark ? {
      background: '#2d2d2d',
      color: '#e9ecef',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    } : {
      background: '#ffffff',
      color: '#212529',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    };

    return { ...baseConfig, ...userConfig };
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  setupToggleButton() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('change', () => this.toggleTheme());
    }
  }

  updateToggleIcon() {
    const toggleBtn = document.getElementById('themeToggle');

    if (toggleBtn) {
      if (this.currentTheme === 'dark') {
        toggleBtn.checked = true;
      } else {
        toggleBtn.checked = false;
      }
    }
  }
}

// Inicializa o gerenciador de tema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Função auxiliar global para usar Swal com tema automático
window.showThemedSwal = (config) => {
  if (window.themeManager) {
    return Swal.fire(window.themeManager.getSwalConfig(config));
  }
  return Swal.fire(config);
};

/**
 * modeSelector.js
 * Responsável por alternar o header e estado visual conforme a tab ativa.
 * Não conhece lógica de PDF nem de imagem — só UI de navegação.
 */

const MODE_CONFIG = {
  merge: {
    iconClass: 'fas fa-file-pdf me-3 fs-1',
    title: 'Unificador de PDF',
    subtitle: 'Unifique múltiplos arquivos PDF em um único arquivo'
  },
  convert: {
    iconClass: 'fas fa-images me-3 fs-1',
    title: 'Conversor de Imagens',
    subtitle: 'Converta imagens JPG, PNG e WEBP para PDF'
  }
};

export function initModeSelector() {
  const tabs = document.querySelectorAll('[data-mode-tab]');

  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
      const mode = e.target.dataset.modeTab;
      applyModeHeader(mode);
    });
  });
}

function applyModeHeader(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) return;

  const icon = document.getElementById('pdfIcon');
  const title = document.getElementById('headerTitle');
  const subtitle = document.getElementById('headerSubtitle');

  if (icon) icon.className = config.iconClass;
  if (title) title.textContent = config.title;
  if (subtitle) subtitle.textContent = config.subtitle;
}
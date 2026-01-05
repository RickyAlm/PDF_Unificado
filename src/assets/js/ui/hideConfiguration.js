function initSecretSettings() {
  const pdfIcon = document.getElementById('pdfIcon');
  const settingsBtn = document.getElementById('settingsBtn');
  let clickCount = 0;
  let clickTimeout;

  if (!pdfIcon || !settingsBtn) return;

  pdfIcon.addEventListener('click', () => {
    clickCount++;

    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      clickCount = 0;
    }, 2000);

    if (clickCount === 5) {
      settingsBtn.classList.remove('d-none');
      clickCount = 0;

      pdfIcon.style.transform = 'scale(1.2)';
      setTimeout(() => {
        pdfIcon.style.transform = 'scale(1)';
      }, 200);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSecretSettings);
} else {
  initSecretSettings();
}
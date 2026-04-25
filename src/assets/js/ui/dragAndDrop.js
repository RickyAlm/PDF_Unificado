export function initDragAndDrop(dropzone, pdfInput) {
  if (!dropzone || !pdfInput) {
    return;
  }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropzone.classList.add('active');
  }

  function unhighlight() {
    dropzone.classList.remove('active');
  }

  dropzone.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    // Ignore internal drags (e.g., Sortable reordering), which do not carry files.
    if (!files || files.length === 0) {
      return;
    }

    pdfInput.files = files;
    pdfInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

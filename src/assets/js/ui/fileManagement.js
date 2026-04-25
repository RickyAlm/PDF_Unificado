const ACCEPTED_PDF_TYPES = ['application/pdf'];

export function initFileManagement(pdfInput, fileNames, mergeBtn) {
  let filesArray = [];

  function updateFileNames() {
    fileNames.innerHTML = '';

    filesArray.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.classList.add('sortable-item');
      fileItem.dataset.index = index;
      fileItem.draggable = true;

      fileItem.innerHTML = `
        <span><i class="fas fa-file-pdf text-danger me-2"></i>${file.name}</span>
        <i class="fas fa-trash-alt remove-file" data-index="${index}"></i>
      `;

      fileNames.appendChild(fileItem);
    });

    fileNames.querySelectorAll('.remove-file').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        removeFile(index);
      });
    });

    mergeBtn.disabled = filesArray.length === 0;
  }

  function removeFile(index) {
    filesArray.splice(index, 1);
    syncFileInput();
    updateFileNames();
  }

  function syncFileInput() {
    const dataTransfer = new DataTransfer();
    filesArray.forEach(file => dataTransfer.items.add(file));
    pdfInput.files = dataTransfer.files;
  }

  function addFiles(files) {
    const incomingFiles = Array.from(files);
    if (incomingFiles.length === 0) {
      return;
    }

    const validFiles = incomingFiles.filter(isValidPdf);
    const rejectedCount = incomingFiles.length - validFiles.length;

    if (rejectedCount > 0) {
      showThemedSwal({
        icon: 'warning',
        title: 'Formato nao suportado',
        text: `${rejectedCount} arquivo(s) ignorado(s). Apenas PDFs sao aceitos.`
      });
    }

    if (validFiles.length === 0) {
      syncFileInput();
      updateFileNames();
      return;
    }

    filesArray.push(...validFiles);
    syncFileInput();
    updateFileNames();
  }

  function isValidPdf(file) {
    return ACCEPTED_PDF_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    addFiles(dt.files);
  }

  pdfInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    pdfInput.value = '';
  });

  if (window.Sortable) {
    new window.Sortable(fileNames, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: function(evt) {
        const movedItem = filesArray[evt.oldIndex];
        filesArray.splice(evt.oldIndex, 1);
        filesArray.splice(evt.newIndex, 0, movedItem);
        syncFileInput();
        updateFileNames();
      }
    });
  } else {
    console.warn('Sortable nao foi carregado. A reordenacao de PDFs ficara indisponivel.');
  }

  mergeBtn.disabled = true;

  return {
    getFiles: () => filesArray
  };
}

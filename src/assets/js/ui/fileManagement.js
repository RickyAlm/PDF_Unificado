const ACCEPTED_PDF_TYPES = ['application/pdf'];

export function initFileManagement(pdfInput, fileNames, mergeBtn) {
  let filesArray = [];
  let pagesArray = [];
  let pageIdCounter = 0;
  const organizePagesBtn = document.getElementById('organizePagesBtn');

  function buildFileLabel(file, index) {
    const fallback = `Documento ${index + 1}`;
    return (file && file.name) ? file.name : fallback;
  }

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

    mergeBtn.disabled = pagesArray.length === 0;
    organizePagesBtn.disabled = pagesArray.length === 0;
  }

  function removeFile(index) {
    const removedFile = filesArray[index];
    filesArray.splice(index, 1);
    pagesArray = pagesArray
      .filter(page => page.fileRef !== removedFile)
      .map(page => ({
        ...page,
        sourceFileIndex: filesArray.indexOf(page.fileRef)
      }));

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

    addValidFiles(validFiles);
  }

  async function addValidFiles(validFiles) {
    for (const file of validFiles) {
      const sourceFileIndex = filesArray.length;
      filesArray.push(file);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const fileLabel = buildFileLabel(file, sourceFileIndex);

        for (let sourcePageIndex = 0; sourcePageIndex < pageCount; sourcePageIndex++) {
          pagesArray.push({
            id: pageIdCounter++,
            sourceFileIndex,
            sourcePageIndex,
            fileLabel,
            fileRef: file
          });
        }
      } catch (error) {
        filesArray.pop();
        console.error('Erro ao carregar PDF:', error);
        showThemedSwal({
          icon: 'error',
          title: 'PDF invalido',
          text: `Nao foi possivel ler o arquivo ${file.name}.`
        });
      }
    }

    syncFileInput();
    updateFileNames();
  }

  function isValidPdf(file) {
    return ACCEPTED_PDF_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
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
        pagesArray = pagesArray.map(page => ({
          ...page,
          sourceFileIndex: filesArray.indexOf(page.fileRef)
        }));
        syncFileInput();
        updateFileNames();
      }
    });
  } else {
    console.warn('Sortable nao foi carregado. A reordenacao de PDFs ficara indisponivel.');
  }

  mergeBtn.disabled = true;
  organizePagesBtn.disabled = true;

  return {
    getFiles: () => filesArray,
    getPages: () => pagesArray.map(({ sourceFileIndex, sourcePageIndex, fileLabel }) => ({ sourceFileIndex, sourcePageIndex, fileLabel })),
    getOrganizerPages: () => pagesArray.map(page => ({ ...page })),
    applyPageOrder: (orderedIds) => {
      const orderMap = new Map(pagesArray.map(page => [page.id, page]));
      pagesArray = orderedIds.map(id => orderMap.get(id)).filter(Boolean);
      updateFileNames();
    }
  };
}

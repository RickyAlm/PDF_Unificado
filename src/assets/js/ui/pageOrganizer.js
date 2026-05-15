import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

const THUMBNAIL_WIDTH = 180;
const PREVIEW_WIDTH = 1100;

export function initPageOrganizer(organizeBtn, modalElement, organizerGrid, applyBtn, resetBtn, handlers) {
  const bootstrapModal = new bootstrap.Modal(modalElement);
  const previewModalElement = document.getElementById('pagePreviewModal');
  const previewModal = new bootstrap.Modal(previewModalElement);
  const previewImage = document.getElementById('pagePreviewImage');
  const previewTitle = document.getElementById('pagePreviewTitle');
  const previewPrevBtn = document.getElementById('pagePreviewPrevBtn');
  const previewNextBtn = document.getElementById('pagePreviewNextBtn');
  const globalLoadingOverlay = document.getElementById('globalLoadingOverlay');
  const thumbnailCache = new Map();
  const previewCache = new Map();
  const documentCache = new Map();
  let workingPages = [];
  let initialOrderIds = [];
  let previewPageId = null;

  if (window.Sortable) {
    new window.Sortable(organizerGrid, {
      animation: 0,
      ghostClass: 'sortable-ghost',
      swapThreshold: 0.74,
      invertSwap: true,
      invertedSwapThreshold: 0.82,
      fallbackTolerance: 3,
      forceFallback: true,
      fallbackOnBody: true,
      fallbackClass: 'organizer-fallback-shadow',
      scroll: false,
      scrollSensitivity: 180,
      scrollSpeed: 40,
      bubbleScroll: true,
      emptyInsertThreshold: 20,
      dragoverBubble: true,
      chosenClass: 'organizer-chosen',
      dragClass: 'organizer-dragging',
      ghostClass: 'organizer-ghost',
      onEnd(evt) {
        const moved = workingPages[evt.oldIndex];
        workingPages.splice(evt.oldIndex, 1);
        workingPages.splice(evt.newIndex, 0, moved);
        refreshGridOrderLabels();
      }
    });
  }

  organizeBtn.addEventListener('click', async () => {
    setOrganizerLoadingState(organizeBtn, true);
    setGlobalLoadingState(globalLoadingOverlay, true);

    try {
      workingPages = handlers.getOrganizerPages().map(page => ({ ...page }));
      initialOrderIds = workingPages.map(page => page.id);
      await renderGrid(organizerGrid, workingPages, thumbnailCache, documentCache);
      bootstrapModal.show();
    } catch (error) {
      console.error('Erro ao abrir organizador de paginas:', error);
      showThemedSwal({
        icon: 'error',
        title: 'Erro ao organizar paginas',
        text: 'Nao foi possivel abrir o organizador agora. Tente novamente.'
      });
    } finally {
      setOrganizerLoadingState(organizeBtn, false);
      setGlobalLoadingState(globalLoadingOverlay, false);
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (initialOrderIds.length === 0 || workingPages.length === 0) {
      return;
    }

    const pageMap = new Map(workingPages.map(page => [page.id, page]));
    workingPages = initialOrderIds.map(id => pageMap.get(id)).filter(Boolean);
    await renderGrid(organizerGrid, workingPages, thumbnailCache, documentCache);
  });

  organizerGrid.addEventListener('click', async (event) => {
    const expandBtn = event.target.closest('.organizer-expand-btn');
    if (!expandBtn) {
      return;
    }

    const pageId = Number.parseInt(expandBtn.dataset.id, 10);
    await openPreview(pageId);
  });

  applyBtn.addEventListener('click', () => {
    const orderedIds = workingPages.map(page => page.id);
    handlers.applyPageOrder(orderedIds);
    bootstrapModal.hide();
  });

  modalElement.addEventListener('hidden.bs.modal', () => {
    workingPages = [];
    initialOrderIds = [];
    previewPageId = null;
    organizerGrid.innerHTML = '';
  });

  previewModalElement.addEventListener('hidden.bs.modal', () => {
    previewPageId = null;
    previewImage.src = '';
  });

  previewPrevBtn.addEventListener('click', async () => {
    await movePreview(-1);
  });

  previewNextBtn.addEventListener('click', async () => {
    await movePreview(1);
  });

  async function movePreview(direction) {
    if (previewPageId === null || workingPages.length === 0) {
      return;
    }

    const currentIndex = workingPages.findIndex(page => page.id === previewPageId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= workingPages.length) {
      return;
    }

    await openPreview(workingPages[nextIndex].id);
  }

  async function openPreview(pageId) {
    const pageIndex = workingPages.findIndex(page => page.id === pageId);
    if (pageIndex < 0) {
      return;
    }

    const page = workingPages[pageIndex];
    previewPageId = page.id;
    previewTitle.textContent = `${page.fileLabel} - pagina ${page.sourcePageIndex + 1}`;
    previewImage.alt = previewTitle.textContent;

    previewPrevBtn.disabled = pageIndex === 0;
    previewNextBtn.disabled = pageIndex === workingPages.length - 1;

    const cacheKey = `${page.sourceFileIndex}::${page.sourcePageIndex}`;
    if (previewCache.has(cacheKey)) {
      previewImage.src = previewCache.get(cacheKey);
      previewModal.show();
      return;
    }

    previewImage.src = '';

    try {
      const previewData = await renderPageImage(page.fileRef, page.sourcePageIndex, documentCache, PREVIEW_WIDTH);
      previewCache.set(cacheKey, previewData);
      previewImage.src = previewData;
      previewModal.show();
    } catch (error) {
      console.error('Erro ao abrir preview da pagina:', error);
      showThemedSwal({
        icon: 'error',
        title: 'Falha ao abrir visualizacao',
        text: 'Nao foi possivel ampliar a pagina selecionada.'
      });
    }
  }

  function refreshGridOrderLabels() {
    organizerGrid.querySelectorAll('.organizer-order-badge').forEach((badge, index) => {
      badge.textContent = `Pag ${index + 1}`;
    });
  }
}

function setOrganizerLoadingState(button, isLoading) {
  if (!button.dataset.defaultHtml) {
    button.dataset.defaultHtml = button.innerHTML;
  }

  button.disabled = isLoading;

  if (isLoading) {
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Carregando...';
    return;
  }

  button.innerHTML = button.dataset.defaultHtml;
}

function setGlobalLoadingState(overlay, isLoading) {
  if (!overlay) {
    return;
  }

  overlay.classList.toggle('d-none', !isLoading);
  overlay.setAttribute('aria-hidden', String(!isLoading));
  document.body.classList.toggle('loading-locked', isLoading);
}

async function renderGrid(container, pages, thumbnailCache, documentCache) {
  container.innerHTML = '';

  for (const [index, page] of pages.entries()) {
    const card = document.createElement('article');
    card.className = 'organizer-card';
    card.dataset.id = page.id;

    const thumb = document.createElement('div');
    thumb.className = 'organizer-thumb';

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'organizer-expand-btn';
    expandBtn.dataset.id = String(page.id);
    expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
    expandBtn.setAttribute('aria-label', 'Abrir visualizacao ampliada');
    thumb.appendChild(expandBtn);

    const img = document.createElement('img');
    img.alt = `${page.fileLabel} - pagina ${page.sourcePageIndex + 1}`;
    img.loading = 'lazy';
    img.className = 'organizer-thumb-image';
    thumb.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'organizer-meta';
    meta.innerHTML = `
      <span class="organizer-order-badge">Pag ${index + 1}</span>
      <span class="organizer-page-source">${page.fileLabel}</span>
      <span class="organizer-page-index">Pagina original: ${page.sourcePageIndex + 1}</span>
    `;

    card.appendChild(thumb);
    card.appendChild(meta);
    container.appendChild(card);

    try {
      const cacheKey = `${page.sourceFileIndex}::${page.sourcePageIndex}`;
      if (thumbnailCache.has(cacheKey)) {
        img.src = thumbnailCache.get(cacheKey);
        continue;
      }

      const thumbnail = await renderPageImage(page.fileRef, page.sourcePageIndex, documentCache, THUMBNAIL_WIDTH);
      thumbnailCache.set(cacheKey, thumbnail);
      img.src = thumbnail;
    } catch {
      img.alt = 'Falha ao renderizar miniatura';
    }
  }
}

async function renderPageImage(file, pageIndex, documentCache, targetWidth) {
  let pdf = documentCache.get(file);

  if (!pdf) {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    pdf = await loadingTask.promise;
    documentCache.set(file, pdf);
  }

  const page = await pdf.getPage(pageIndex + 1);

  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.ceil(scaledViewport.width);
  canvas.height = Math.ceil(scaledViewport.height);

  await page.render({
    canvasContext: context,
    viewport: scaledViewport
  }).promise;

  return canvas.toDataURL('image/png');
}

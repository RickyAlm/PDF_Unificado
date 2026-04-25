import { initDragAndDrop } from '../ui/dragAndDrop.js';
import { initFileManagement } from '../ui/fileManagement.js';
import { initPagination } from '../ui/pagination.js';
import { initPDFMerger } from '../pdf/pdfMerger.js';
import { initModeSelector } from '../ui/modeSelector.js';
import { initImageConverter } from '../image/imageToPdf.js';

(() => {
  // ─── Modo: Unificar PDFs ────────────────────────────────────────────────
  const pdfInput     = document.getElementById('pdfInput');
  const dropzone     = document.getElementById('dropzone');
  const fileNames    = document.getElementById('fileNames');
  const mergeBtn     = document.getElementById('mergeBtn');

  initDragAndDrop(dropzone, pdfInput);
  const { getFiles } = initFileManagement(pdfInput, fileNames, mergeBtn);
  initPagination();
  initPDFMerger(getFiles, mergeBtn);

  // ─── Modo: Converter Imagens ────────────────────────────────────────────
  const imageInput      = document.getElementById('imageInput');
  const imageFileNames  = document.getElementById('imageFileNames');
  const convertBtn      = document.getElementById('convertBtn');

  initImageConverter(imageInput, imageFileNames, convertBtn);

  // ─── Navegação entre modos ──────────────────────────────────────────────
  initModeSelector();
})();

import { initDragAndDrop } from '../ui/dragAndDrop.js';
import { initFileManagement } from '../ui/fileManagement.js';
import { initPagination } from '../ui/pagination.js';
import { initPDFMerger } from '../pdf/pdfMerger.js';

(() => {
  const pdfInput = document.getElementById('pdfInput');
  const dropzone = document.getElementById('dropzone');
  const fileNames = document.getElementById('fileNames');
  const mergeBtn = document.getElementById('mergeBtn');

  initDragAndDrop(dropzone, pdfInput);
  initFileManagement(pdfInput, fileNames, mergeBtn);
  initPagination();
  initPDFMerger(pdfInput, mergeBtn);
})();
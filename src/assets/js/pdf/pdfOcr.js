/**
 * pdfOcr.js
 * Aplica OCR (Tesseract.js) a múltiplos PDFs, processados um de cada vez.
 * Cada PDF recebe uma camada de texto invisível (pesquisável) sobreposta
 * à imagem renderizada de cada página, preservando a aparência original.
 * Ao final, cada PDF processado é baixado separadamente (nunca unificado).
 */

import { formatFileName } from '../utils/index.js';
import { loadOverlayFont } from '../ui/pagination.js';

const OCR_LANGUAGES = 'por+eng';
const RENDER_SCALE = 2.5;
const DOWNLOAD_STAGGER_MS = 400;

/**
 * Tesseract.js carrega internamente sua própria cópia do pdf.js e substitui
 * o global `pdfjsLib` em tempo de execução. Por isso o workerSrc precisa ser
 * resolvido dinamicamente a partir de `pdfjsLib.version` a cada uso, em vez
 * de fixado uma única vez no carregamento do módulo.
 */
function ensurePdfJsWorker() {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }
}

export function initPdfOcr(ocrInput, ocrFileNames, ocrBtn) {
  let filesArray = [];

  const progressWrapper = document.getElementById('ocrProgressWrapper');
  const progressBar = document.getElementById('ocrProgressBar');
  const progressLabel = document.getElementById('ocrProgressLabel');
  const progressPercent = document.getElementById('ocrProgressPercent');

  // ─── Lista de arquivos ──────────────────────────────────────────────────

  function updateFileList() {
    ocrFileNames.innerHTML = '';

    filesArray.forEach((file, index) => {
      const item = document.createElement('div');
      item.classList.add('sortable-item');
      item.dataset.index = index;

      item.innerHTML = `
        <span class="d-flex align-items-center gap-2">
          <i class="fas fa-file-pdf text-danger"></i>
          <span class="file-name-text">${file.name}</span>
        </span>
        <i class="fas fa-trash-alt remove-file" data-index="${index}" title="Remover PDF"></i>
      `;

      ocrFileNames.appendChild(item);
    });

    ocrFileNames.querySelectorAll('.remove-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        removeFile(index);
      });
    });

    ocrBtn.disabled = filesArray.length === 0;
  }

  function addFiles(files) {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const valid = incoming.filter(isValidPdf);
    const rejected = incoming.length - valid.length;

    if (rejected > 0) {
      showThemedSwal({
        icon: 'warning',
        title: 'Formato não suportado',
        text: `${rejected} arquivo(s) ignorado(s). Apenas PDFs são aceitos.`
      });
    }

    filesArray.push(...valid);
    syncInput();
    updateFileList();
  }

  function removeFile(index) {
    filesArray.splice(index, 1);
    syncInput();
    updateFileList();
  }

  function syncInput() {
    const dt = new DataTransfer();
    filesArray.forEach(f => dt.items.add(f));
    ocrInput.files = dt.files;
  }

  function isValidPdf(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  ocrInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    ocrInput.value = '';
  });

  const ocrDropzone = document.getElementById('ocrDropzone');
  if (ocrDropzone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      ocrDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(evt => {
      ocrDropzone.addEventListener(evt, () => ocrDropzone.classList.add('active'));
    });

    ['dragleave', 'drop'].forEach(evt => {
      ocrDropzone.addEventListener(evt, () => ocrDropzone.classList.remove('active'));
    });

    ocrDropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
  }

  ocrBtn.disabled = true;

  // ─── Execução do OCR ────────────────────────────────────────────────────

  window.runPdfOcr = async function () {
    if (filesArray.length === 0) return;

    ocrBtn.disabled = true;
    progressWrapper.classList.remove('d-none');
    setProgress(0, 'Preparando OCR...');

    let worker;

    try {
      worker = await Tesseract.createWorker(OCR_LANGUAGES);

      const results = [];

      for (const [fileIndex, file] of filesArray.entries()) {
        const baseProgress = fileIndex / filesArray.length;

        setProgress(
          baseProgress * 100,
          `Processando ${file.name} (${fileIndex + 1}/${filesArray.length})...`
        );

        const pdfBytes = await ocrSinglePdf(file, worker, (pageNumber, totalPages) => {
          const fileFraction = pageNumber / totalPages / filesArray.length;
          setProgress(
            (baseProgress + fileFraction) * 100,
            `${file.name}: página ${pageNumber}/${totalPages} (arquivo ${fileIndex + 1}/${filesArray.length})`
          );
        });

        results.push({ name: buildOutputName(file.name), bytes: pdfBytes });
      }

      setProgress(100, 'Concluído!');
      await worker.terminate();
      worker = null;

      downloadAllSeparately(results);
      showDoneAlert(results.length);
    } catch (error) {
      console.error('Erro ao aplicar OCR:', error);
      if (worker) {
        try { await worker.terminate(); } catch (_) { /* noop */ }
      }
      showThemedSwal({
        icon: 'error',
        title: 'Erro no OCR',
        text: error.message || 'Não foi possível concluir o OCR de um ou mais arquivos.'
      });
    } finally {
      ocrBtn.disabled = filesArray.length === 0;
      progressWrapper.classList.add('d-none');
    }
  };

  function setProgress(percent, label) {
    const clamped = Math.max(0, Math.min(100, percent));
    progressBar.style.width = `${clamped}%`;
    progressPercent.textContent = `${Math.round(clamped)}%`;
    if (label) progressLabel.textContent = label;
  }

  function buildOutputName(originalName) {
    const base = originalName.replace(/\.pdf$/i, '');
    return formatFileName(`${base}_ocr`);
  }

  function downloadAllSeparately(results) {
    results.forEach((result, index) => {
      setTimeout(() => download(result.bytes, result.name, 'application/pdf'), index * DOWNLOAD_STAGGER_MS);
    });
  }

  function showDoneAlert(count) {
    showThemedSwal({
      icon: 'success',
      title: 'OCR concluído!',
      text: `${count} PDF(s) processado(s) e baixado(s) separadamente.`
    });
  }

  return { getFiles: () => filesArray };
}

// ─── OCR de um único PDF ──────────────────────────────────────────────────

async function ocrSinglePdf(file, worker, onPageProgress) {
  const arrayBuffer = await file.arrayBuffer();

  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer.slice(0));
  const font = await loadOverlayFont(pdfDoc);

  ensurePdfJsWorker();
  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdfJsDoc.numPages;

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const pdfJsPage = await pdfJsDoc.getPage(pageNumber);
    const viewport = pdfJsPage.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pdfJsPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const words = flattenWords(data.blocks);

    applyInvisibleTextLayer(pdfDoc.getPage(pageNumber - 1), words, viewport, font);

    onPageProgress(pageNumber, totalPages);

    canvas.width = 0;
    canvas.height = 0;
  }

  return await pdfDoc.save();
}

function flattenWords(blocks) {
  const words = [];

  for (const block of blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          words.push(word);
        }
      }
    }
  }

  return words;
}

function applyInvisibleTextLayer(pdfPage, words, viewport, font) {
  if (!words || words.length === 0) return;

  const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize();
  const scaleX = pdfWidth / viewport.width;
  const scaleY = pdfHeight / viewport.height;

  for (const word of words) {
    const text = word.text?.trim();
    if (!text) continue;

    const { x0, x1, y0, y1 } = word.bbox;
    const boxWidth = (x1 - x0) * scaleX;
    const boxHeight = (y1 - y0) * scaleY;
    if (boxWidth <= 0 || boxHeight <= 0) continue;

    const fontSize = Math.max(boxHeight * 0.82, 1);

    pdfPage.drawText(text, {
      x: x0 * scaleX,
      y: pdfHeight - (y1 * scaleY),
      size: fontSize,
      font,
      renderMode: PDFLib.TextRenderingMode.Invisible
    });
  }
}

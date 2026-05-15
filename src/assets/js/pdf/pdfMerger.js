import { addCustomDate, addPageNumbers, getProcessingSettings, loadOverlayFont } from '../ui/pagination.js';
import { validateFileName, formatFileName } from '../utils/index.js';
import { previewPDF } from './pdfViewer.js';

export function initPDFMerger(getFiles, getPages, mergeBtn) {
  window.mergePDFs = async function() {
    const inputFiles = getFiles();
    const selectedPages = getPages();
    const pdfNameInput = document.getElementById('pdfName');
    const settings = getProcessingSettings();

    if (!validateFileName(pdfNameInput.value.trim())) {
      showInvalidNameAlert();
      return;
    }

    const pdfName = formatFileName(pdfNameInput.value.trim());

    if (inputFiles.length < 1 || selectedPages.length < 1) {
      showNoFilesAlert();
      return;
    }

    try {
      showProcessingAlert();

      const { mergedPdfBytes, totalPages } = await processPDFs(
        inputFiles,
        selectedPages,
        settings
      );

      showSuccessAlert(inputFiles.length, totalPages, mergedPdfBytes, pdfName);
    } catch (error) {
      handleMergeError(error);
    }
  };

  async function processPDFs(files, selectedPages, settings) {
    const mergedPdf = await PDFLib.PDFDocument.create();
    let currentPageNumber = 0;
    const totalPages = selectedPages.length;
    const sourceDocCache = new Map();

    const font = await loadOverlayFont(mergedPdf);

    for (const pageRef of selectedPages) {
      const { sourceFileIndex, sourcePageIndex } = pageRef;
      const sourceFile = files[sourceFileIndex];

      if (!sourceFile) {
        continue;
      }

      if (!sourceDocCache.has(sourceFileIndex)) {
        const arrayBuffer = await sourceFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        sourceDocCache.set(sourceFileIndex, pdfDoc);
      }

      const sourceDoc = sourceDocCache.get(sourceFileIndex);
      const copiedPages = await mergedPdf.copyPages(sourceDoc, [sourcePageIndex]);

      if (copiedPages.length === 0) {
        continue;
      }

      currentPageNumber++;
      const newPage = mergedPdf.addPage(copiedPages[0]);

      if (settings.shouldPaginate) {
        addPageNumbers(newPage, currentPageNumber, totalPages, settings.shouldPaginateFirstPage, font);
      }

      if (settings.shouldApplyCustomDate && (settings.shouldApplyCustomDateFirstPage || currentPageNumber > 1)) {
        addCustomDate(newPage, settings.customDate, font);
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    return { mergedPdfBytes, totalPages };
  }

  function showInvalidNameAlert() {
    showThemedSwal({
      icon: 'error',
      title: 'Nome inválido',
      text: 'O nome não pode conter: / \\ : * ? " < > |'
    });
  }

  function showNoFilesAlert() {
    showThemedSwal({
      icon: 'warning',
      title: 'Oops...',
      text: 'Selecione pelo menos um arquivo PDF!'
    });
  }

  function showProcessingAlert() {
    showThemedSwal({
      title: 'Processando...',
      html: 'Unificando seus arquivos PDF. Por favor, aguarde.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  function showSuccessAlert(fileCount, pageCount, pdfBytes, pdfName) {
    Swal.close();
    showThemedSwal({
      icon: 'success',
      title: 'Pronto!',
      html: `Seu PDF com ${fileCount} arquivo(s) unificado(s) e ${pageCount} páginas está pronto.<br><br>
            <div class="d-flex justify-content-center gap-2">
              <button id="previewBtn" class="btn btn-outline-primary">
                <i class="fas fa-eye me-2"></i>Visualizar
              </button>
            </div>`,
      confirmButtonColor: '#198754',
      confirmButtonText: '<i class="fas fa-download me-2"></i>Download',
      showCancelButton: true,
      cancelButtonText: 'Fechar',
      didOpen: () => {
        document.getElementById('previewBtn').addEventListener('click', () => {
          previewPDF(pdfBytes);
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        download(pdfBytes, pdfName, "application/pdf");
      }
    });
  }

  function handleMergeError(error) {
    console.error('Erro ao unificar PDFs:', error);
    showThemedSwal({
      icon: 'error',
      title: 'Erro',
      text: 'Ocorreu um erro ao processar os arquivos. Verifique se todos são PDFs válidos.'
    });
  }
}

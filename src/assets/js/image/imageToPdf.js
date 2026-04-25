/**
 * imageToPdf.js
 * Converte um array de imagens (JPG, PNG, WEBP) em um único PDF.
 * Uma imagem por página. Dimensão da página = dimensão da imagem.
 *
 * Estratégia de normalização:
 *   Toda imagem passa pelo canvas antes de ser incorporada ao pdf-lib.
 *   Isso resolve:
 *     - PNG com canal alfa (seria preto no pdf-lib sem fundo)
 *     - WEBP (pdf-lib não suporta embedWebp nativamente)
 *     - JPEG com perfis de cor exóticos (ICC profiles)
 *   Saída padronizada: JPEG 92% de qualidade.
 */

import { initImageManagement } from '../ui/imageManagement.js';
import { validateFileName, formatFileName } from '../utils/index.js';
import { previewPDF } from '../pdf/pdfViewer.js';
import { addCustomDate, getProcessingSettings, loadOverlayFont } from '../ui/pagination.js';

export function initImageConverter(imageInput, imageFileNames, convertBtn) {
  // Inicializa o gerenciador de lista e obtém acesso ao array interno
  const { getImages } = initImageManagement(imageInput, imageFileNames, convertBtn);

  window.convertImagesToPDF = async function () {
    const images = getImages();
    const pdfNameInput = document.getElementById('convertPdfName');
    const rawName = pdfNameInput.value.trim();

    if (!validateFileName(rawName)) {
      showThemedSwal({
        icon: 'error',
        title: 'Nome inválido',
        text: 'O nome não pode conter: / \\ : * ? " < > |'
      });
      return;
    }

    if (images.length === 0) {
      showThemedSwal({
        icon: 'warning',
        title: 'Nenhuma imagem',
        text: 'Selecione pelo menos uma imagem para converter.'
      });
      return;
    }

    const pdfName = formatFileName(rawName || 'imagens_convertidas');

    try {
      showProcessingAlert(images.length);

      const pdfBytes = await buildPdfFromImages(images, getProcessingSettings());

      showSuccessAlert(images.length, pdfBytes, pdfName);
    } catch (error) {
      handleConvertError(error);
    }
  };

  // ─── Construção do PDF ────────────────────────────────────────────────────

  async function buildPdfFromImages(images, settings) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = settings.shouldApplyCustomDate
      ? await loadOverlayFont(pdfDoc)
      : null;

    for (const [index, file] of images.entries()) {
      const { jpegBytes, width, height } = await normalizeToJpeg(file);

      const embeddedImg = await pdfDoc.embedJpg(jpegBytes);

      // Página com as dimensões exatas da imagem (preserva aspecto)
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width,
        height
      });

      if (settings.shouldApplyCustomDate && font && (settings.shouldApplyCustomDateFirstPage || index > 0)) {
        addCustomDate(page, settings.customDate, font);
      }
    }

    return await pdfDoc.save();
  }

  // ─── Normalização via canvas ──────────────────────────────────────────────

  /**
   * Converte qualquer imagem suportada para JPEG via canvas.
   * Retorna: { jpegBytes: Uint8Array, width: number, height: number }
   */
  async function normalizeToJpeg(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');

          // Fundo branco para imagens com transparência (PNG, WEBP com alfa)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Falha ao processar: ${file.name}`));
                return;
              }
              blob.arrayBuffer().then((buffer) => {
                URL.revokeObjectURL(objectUrl);
                resolve({
                  jpegBytes: new Uint8Array(buffer),
                  width: canvas.width,
                  height: canvas.height
                });
              });
            },
            'image/jpeg',
            0.92
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Não foi possível carregar: ${file.name}`));
      };

      img.src = objectUrl;
    });
  }

  // ─── Alertas ─────────────────────────────────────────────────────────────

  function showProcessingAlert(count) {
    showThemedSwal({
      title: 'Convertendo...',
      html: `Processando ${count} imagem(s). Por favor, aguarde.`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  function showSuccessAlert(imageCount, pdfBytes, pdfName) {
    Swal.close();
    showThemedSwal({
      icon: 'success',
      title: 'Pronto!',
      html: `${imageCount} imagem(ns) convertida(s) com sucesso.<br><br>
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
        download(pdfBytes, pdfName, 'application/pdf');
      }
    });
  }

  function handleConvertError(error) {
    console.error('Erro ao converter imagens:', error);
    Swal.close();
    showThemedSwal({
      icon: 'error',
      title: 'Erro na conversão',
      text: error.message || 'Verifique se todos os arquivos são imagens válidas (JPG, PNG ou WEBP).'
    });
  }
}

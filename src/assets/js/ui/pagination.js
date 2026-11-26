const BASE_PAGE_SIZE = {
  width: 1190.55005,
  height: 841.89001
};

const PAGE_NUMBER_LAYOUT = {
  currentSingleDigit: { x: 0.935324, y: 0.878844, size: 36 },
  currentDoubleDigit: { x: 0.935324, y: 0.874093, size: 36 },
  totalSingleDigit: { x: 0.966402, y: 0.929920, size: 36 },
  totalDoubleDigit: { x: 0.968082, y: 0.914478, size: 36 }
};

// Modelo "Pessoal". Frações medidas em "Prancha para teste.pdf" (A3 1190.55 x 841.89, origem embaixo à esquerda).
const PERSONAL_COLORS = {
  text: PDFLib.rgb(0x66 / 255, 0x5a / 255, 0x46 / 255),
  // #d4cdc5: tom em que o fundo do modelo é renderizado (#d4cdc2 deixava uma borda visível)
  background: PDFLib.rgb(0xd4 / 255, 0xcd / 255, 0xc5 / 255)
};

// Número no quadro "PRANCHA:" (canto inferior direito), centralizado pela tinta do "PRANCHA:" (x ≈ 1099.2)
const PERSONAL_PAGE_NUMBER_LAYOUT = {
  textCenterX: 0.923290,
  textBaselineY: 0.034600,
  size: 26,
  // Espaço extra de cada lado da barra ("17" + 3.3pt + "/" + 3.3pt + "25"), medido no modelo
  separatorGap: 3.3,
  cover: { x: 0.886200, y: 0.023800, width: 0.071400, height: 0.042200 }
};

// Data no rodapé: "... | 24/11/2026 | Folha A3 | ...", alinhada à esquerda no início da 2ª linha
const PERSONAL_DATE_LAYOUT = {
  textX: 0.268066,
  textBaselineY: 0.039941,
  size: 11,
  cover: { x: 0.267120, y: 0.035634, width: 0.050985, height: 0.018637 }
};

export const OVERLAY_STYLES = {
  DUAL: 'dual',
  PERSONAL: 'pessoal'
};

const FONT_PATHS = {
  centuryGothic: '../../fonts/CenturyGothic/centurygothic.ttf',
  openSansRegular: '../../fonts/OpenSans/OpenSans-Regular.ttf'
};

const DATE_OVERLAY_LAYOUT = {
  x: 0.947500,
  y: 0.764000,
  width: 0.013500,
  height: 0.083000,
  textOffsetX: 9,
  preferredFontSize: 16,
  minFontSize: 11,
  padding: 2,
  backgroundColor: PDFLib.rgb(1, 1, 1),
  textColor: PDFLib.rgb(0, 0, 0)
};

export function initPagination() {
  const paginateToggle = document.getElementById('paginateToggle');
  const paginateSkipPages = document.getElementById('paginateSkipPages');
  const paginateSkipWrapper = document.getElementById('paginateSkipWrapper');
  const customDateToggle = document.getElementById('customDateToggle');
  const customDateSkipPages = document.getElementById('customDateSkipPages');
  const customDateInput = document.getElementById('customDateInput');
  const customDateFieldWrapper = document.getElementById('customDateFieldWrapper');
  const overlayStyleToggle = document.getElementById('overlayStyleToggle');
  const overlayStyleWrapper = document.getElementById('overlayStyleWrapper');

  if (!paginateToggle || !paginateSkipPages || !paginateSkipWrapper || !customDateToggle || !customDateSkipPages || !customDateInput || !customDateFieldWrapper
    || !overlayStyleToggle || !overlayStyleWrapper) {
    return;
  }

  setupStyleSwitch(overlayStyleToggle, overlayStyleWrapper);

  paginateToggle.checked = false;
  paginateSkipPages.value = '';
  customDateToggle.checked = false;
  customDateSkipPages.value = '';
  customDateInput.value = getTodayInputValue();

  const syncPaginateState = () => {
    paginateSkipWrapper.classList.toggle('d-none', !paginateToggle.checked);
  };

  const validatePageListInput = (input) => {
    const { error } = parsePageList(input.value);
    input.classList.toggle('is-invalid', Boolean(error));
  };

  const syncDateState = () => {
    if (customDateToggle.checked && !customDateInput.value) {
      customDateInput.value = getTodayInputValue();
    }

    customDateFieldWrapper.classList.toggle('d-none', !customDateToggle.checked);
  };

  paginateToggle.addEventListener('change', syncPaginateState);
  paginateSkipPages.addEventListener('input', () => validatePageListInput(paginateSkipPages));
  customDateSkipPages.addEventListener('input', () => validatePageListInput(customDateSkipPages));
  customDateToggle.addEventListener('change', syncDateState);

  syncPaginateState();
  syncDateState();
}

// Toggle "Dual [switch] Pessoal": desmarcado = Dual, marcado = Pessoal. Os rótulos também alternam.
function setupStyleSwitch(toggle, wrapper) {
  const labels = wrapper.querySelectorAll('.pagination-style-label');

  const syncLabels = () => {
    const activeStyle = getStyleFromToggle(toggle);
    labels.forEach(label => label.classList.toggle('active', label.dataset.style === activeStyle));
  };

  toggle.checked = false;
  toggle.addEventListener('change', syncLabels);
  labels.forEach(label => {
    label.addEventListener('click', () => {
      toggle.checked = label.dataset.style === OVERLAY_STYLES.PERSONAL;
      syncLabels();
    });
  });
  syncLabels();
}

function getStyleFromToggle(toggle) {
  return toggle?.checked ? OVERLAY_STYLES.PERSONAL : OVERLAY_STYLES.DUAL;
}

export function getProcessingSettings() {
  const paginateToggle = document.getElementById('paginateToggle');
  const paginateSkipPages = document.getElementById('paginateSkipPages');
  const customDateToggle = document.getElementById('customDateToggle');
  const customDateSkipPages = document.getElementById('customDateSkipPages');
  const customDateInput = document.getElementById('customDateInput');
  const overlayStyle = getStyleFromToggle(document.getElementById('overlayStyleToggle'));

  const customDate = formatDateForDisplay(customDateInput?.value || getTodayInputValue());
  const shouldPaginate = Boolean(paginateToggle?.checked);
  const shouldApplyCustomDate = Boolean(customDateToggle?.checked);
  const noSkip = { pages: new Set(), error: null };
  const skipPages = shouldPaginate ? parsePageList(paginateSkipPages?.value || '') : noSkip;
  const skipDatePages = shouldApplyCustomDate ? parsePageList(customDateSkipPages?.value || '') : noSkip;

  return {
    shouldPaginate,
    skipPaginationPages: skipPages.pages,
    skipPaginationError: skipPages.error,
    overlayStyle,
    shouldApplyCustomDate,
    skipCustomDatePages: skipDatePages.pages,
    skipCustomDateError: skipDatePages.error,
    customDate
  };
}

export async function loadOverlayFont(pdfDocument) {
  return await loadFont(pdfDocument, FONT_PATHS.centuryGothic, PDFLib.StandardFonts.Helvetica);
}

export async function loadPersonalFont(pdfDocument) {
  return await loadFont(pdfDocument, FONT_PATHS.openSansRegular, PDFLib.StandardFonts.Helvetica);
}

async function loadFont(pdfDocument, fontPath, fallbackFont) {
  try {
    const fontkitInstance = window.fontkit || globalThis.fontkit;
    if (!fontkitInstance) {
      throw new Error('fontkit nao foi carregado no navegador');
    }

    pdfDocument.registerFontkit(fontkitInstance);

    const fontUrl = new URL(fontPath, import.meta.url);
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error(`Falha ao carregar ${fontPath}`);
    }

    const fontBytes = await fontResponse.arrayBuffer();
    return await pdfDocument.embedFont(fontBytes);
  } catch (error) {
    console.warn(`Fonte ${fontPath} não encontrada, usando ${fallbackFont} como fallback`, error);
    return await pdfDocument.embedFont(fallbackFont);
  }
}

const MAX_PAGE_NUMBER = 9999;

// Lê listas como "1, 5, 8-10" e devolve o conjunto de páginas (base 1). Aceita vírgula, ponto e vírgula ou espaço.
export function parsePageList(text) {
  const pages = new Set();
  const tokens = String(text).replace(/\s*-\s*/g, '-').split(/[\s,;]+/).filter(Boolean);

  for (const token of tokens) {
    const match = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      return { pages: new Set(), error: `"${token}" não é um número ou intervalo válido.` };
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start) {
      return { pages: new Set(), error: `"${token}" não é um intervalo válido.` };
    }

    if (end > MAX_PAGE_NUMBER) {
      return { pages: new Set(), error: `"${token}" passa do limite de ${MAX_PAGE_NUMBER} páginas.` };
    }

    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      pages.add(pageNumber);
    }
  }

  return { pages, error: null };
}

export function addPageNumbers(page, displayPageNumber, displayTotalPages, font) {
  drawRotatedText(page, `${displayPageNumber}`, displayPageNumber < 10
    ? PAGE_NUMBER_LAYOUT.currentSingleDigit
    : PAGE_NUMBER_LAYOUT.currentDoubleDigit, font);

  drawRotatedText(page, `${displayTotalPages}`, displayTotalPages < 10
    ? PAGE_NUMBER_LAYOUT.totalSingleDigit
    : PAGE_NUMBER_LAYOUT.totalDoubleDigit, font);
}

export function addPersonalPageNumbers(page, displayPageNumber, displayTotalPages, font) {
  const currentText = String(displayPageNumber).padStart(2, '0');
  const totalText = String(displayTotalPages).padStart(2, '0');
  const separatorText = '/';

  const { width, height } = page.getSize();
  const pageScale = getPageScale(width, height);
  const layout = PERSONAL_PAGE_NUMBER_LAYOUT;

  page.drawRectangle({
    x: width * layout.cover.x,
    y: height * layout.cover.y,
    width: width * layout.cover.width,
    height: height * layout.cover.height,
    color: PERSONAL_COLORS.background
  });

  const fontSize = layout.size * pageScale;
  const gap = layout.separatorGap * pageScale;
  const parts = [currentText, separatorText, totalText];
  const partWidths = parts.map(part => font.widthOfTextAtSize(part, fontSize));
  const fullWidth = partWidths.reduce((sum, partWidth) => sum + partWidth, 0) + (gap * (parts.length - 1));
  const baselineY = height * layout.textBaselineY;
  let x = (width * layout.textCenterX) - (fullWidth / 2);

  parts.forEach((part, index) => {
    page.drawText(part, { x, y: baselineY, size: fontSize, color: PERSONAL_COLORS.text, font });
    x += partWidths[index] + gap;
  });
}

export function addPersonalCustomDate(page, customDate, font) {
  if (!customDate) {
    return;
  }

  const { width, height } = page.getSize();
  const pageScale = getPageScale(width, height);
  const layout = PERSONAL_DATE_LAYOUT;

  page.drawRectangle({
    x: width * layout.cover.x,
    y: height * layout.cover.y,
    width: width * layout.cover.width,
    height: height * layout.cover.height,
    color: PERSONAL_COLORS.background
  });

  page.drawText(customDate, {
    x: width * layout.textX,
    y: height * layout.textBaselineY,
    size: layout.size * pageScale,
    color: PERSONAL_COLORS.text,
    font
  });
}

export function addCustomDate(page, customDate, font) {
  if (!customDate) {
    return;
  }

  const { width, height } = page.getSize();
  const rect = {
    x: width * DATE_OVERLAY_LAYOUT.x,
    y: height * DATE_OVERLAY_LAYOUT.y,
    width: width * DATE_OVERLAY_LAYOUT.width,
    height: height * DATE_OVERLAY_LAYOUT.height
  };

  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    color: DATE_OVERLAY_LAYOUT.backgroundColor
  });

  const pageScale = getPageScale(width, height);
  const preferredFontSize = DATE_OVERLAY_LAYOUT.preferredFontSize * pageScale;
  const padding = DATE_OVERLAY_LAYOUT.padding * pageScale;
  const fontSize = getFittingFontSize(
    font,
    customDate,
    rect.width - (padding * 2),
    rect.height - (padding * 2),
    preferredFontSize,
    DATE_OVERLAY_LAYOUT.minFontSize
  );

  const textWidth = font.widthOfTextAtSize(customDate, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  page.drawText(customDate, {
    x: rect.x + ((rect.width - textHeight) / 2) + (DATE_OVERLAY_LAYOUT.textOffsetX * pageScale),
    y: rect.y + ((rect.height - textWidth) / 2),
    size: fontSize,
    color: DATE_OVERLAY_LAYOUT.textColor,
    rotate: PDFLib.degrees(90),
    font
  });
}

function drawRotatedText(page, text, layout, font) {
  const { width, height } = page.getSize();
  const pageScale = getPageScale(width, height);

  page.drawText(text, {
    x: width * layout.x,
    y: height * layout.y,
    size: layout.size * pageScale,
    color: PDFLib.rgb(0, 0, 0),
    rotate: PDFLib.degrees(90),
    font
  });
}

function getPageScale(width, height) {
  return Math.min(width / BASE_PAGE_SIZE.width, height / BASE_PAGE_SIZE.height);
}

function getFittingFontSize(font, text, maxWidth, maxHeight, preferredSize, minSize) {
  let size = preferredSize;

  while (size > minSize) {
    const textWidth = font.widthOfTextAtSize(text, size);
    const textHeight = font.heightAtSize(size);

    if (textHeight <= maxWidth && textWidth <= maxHeight) {
      return size;
    }

    size -= 0.5;
  }

  return minSize;
}

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(isoDate) {
  const [year, month, day] = isoDate.split('-');

  if (!year || !month || !day) {
    return formatDateForDisplay(getTodayInputValue());
  }

  return `${day}/${month}/${year}`;
}

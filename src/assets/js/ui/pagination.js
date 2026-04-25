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
  const paginateFirstPage = document.getElementById('paginateFirstPage');
  const customDateToggle = document.getElementById('customDateToggle');
  const customDateFirstPage = document.getElementById('customDateFirstPage');
  const customDateInput = document.getElementById('customDateInput');
  const customDateFieldWrapper = document.getElementById('customDateFieldWrapper');

  if (!paginateToggle || !paginateFirstPage || !customDateToggle || !customDateFirstPage || !customDateInput || !customDateFieldWrapper) {
    return;
  }

  paginateToggle.checked = true;
  paginateFirstPage.checked = true;
  customDateToggle.checked = true;
  customDateFirstPage.checked = true;
  customDateInput.value = getTodayInputValue();

  const syncPaginateState = () => {
    if (!paginateToggle.checked) {
      paginateFirstPage.checked = false;
      paginateFirstPage.disabled = true;
      return;
    }

    paginateFirstPage.checked = true;
    paginateFirstPage.disabled = false;
  };

  const syncDateState = () => {
    if (!customDateToggle.checked) {
      customDateFirstPage.checked = false;
      customDateFirstPage.disabled = true;
    } else {
      customDateFirstPage.checked = true;
      customDateFirstPage.disabled = false;
    }

    if (customDateToggle.checked && !customDateInput.value) {
      customDateInput.value = getTodayInputValue();
    }

    customDateFieldWrapper.classList.toggle('d-none', !customDateToggle.checked);
  };

  paginateToggle.addEventListener('change', syncPaginateState);
  customDateToggle.addEventListener('change', syncDateState);

  syncPaginateState();
  syncDateState();
}

export function getProcessingSettings() {
  const paginateToggle = document.getElementById('paginateToggle');
  const paginateFirstPage = document.getElementById('paginateFirstPage');
  const customDateToggle = document.getElementById('customDateToggle');
  const customDateFirstPage = document.getElementById('customDateFirstPage');
  const customDateInput = document.getElementById('customDateInput');

  const customDate = formatDateForDisplay(customDateInput?.value || getTodayInputValue());

  return {
    shouldPaginate: Boolean(paginateToggle?.checked),
    shouldPaginateFirstPage: Boolean(paginateFirstPage?.checked),
    shouldApplyCustomDate: Boolean(customDateToggle?.checked),
    shouldApplyCustomDateFirstPage: Boolean(customDateFirstPage?.checked),
    customDate
  };
}

export async function loadOverlayFont(pdfDocument) {
  try {
    const fontkitInstance = window.fontkit || globalThis.fontkit;
    if (!fontkitInstance) {
      throw new Error('fontkit nao foi carregado no navegador');
    }

    pdfDocument.registerFontkit(fontkitInstance);

    const fontUrl = new URL('../../fonts/CenturyGothic/centurygothic.ttf', import.meta.url);
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error('Falha ao carregar centurygothic.ttf');
    }

    const fontBytes = await fontResponse.arrayBuffer();
    return await pdfDocument.embedFont(fontBytes);
  } catch (error) {
    console.warn('Fonte Century Gothic não encontrada, usando Helvetica como fallback', error);
    return await pdfDocument.embedFont(PDFLib.StandardFonts.Helvetica);
  }
}

export function addPageNumbers(page, currentPageNumber, totalPages, shouldPaginateFirstPage, font) {
  if (!shouldPaginateFirstPage && currentPageNumber === 1) {
    return;
  }

  const displayPageNumber = !shouldPaginateFirstPage ? currentPageNumber - 1 : currentPageNumber;
  const displayTotalPages = !shouldPaginateFirstPage ? totalPages - 1 : totalPages;

  drawRotatedText(page, `${displayPageNumber}`, displayPageNumber < 10
    ? PAGE_NUMBER_LAYOUT.currentSingleDigit
    : PAGE_NUMBER_LAYOUT.currentDoubleDigit, font);

  drawRotatedText(page, `${displayTotalPages}`, displayTotalPages < 10
    ? PAGE_NUMBER_LAYOUT.totalSingleDigit
    : PAGE_NUMBER_LAYOUT.totalDoubleDigit, font);
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

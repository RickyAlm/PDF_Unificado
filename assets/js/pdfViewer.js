export function previewPDF(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');

  if (!win || win.closed || typeof win.closed === 'undefined') {
    showThemedSwal({
      title: 'Visualização do PDF',
      html: `<iframe src="${url}" style="width:100%; height:70vh; border:none;"></iframe>`,
      width: '80%',
      showConfirmButton: false,
      showCloseButton: true
    });
  }

  if (win && !win.closed && typeof win.closed !== 'undefined') {
    const interval = setInterval(() => {
      if (win.closed) {
        clearInterval(interval);
        URL.revokeObjectURL(url);
      }
    }, 1000);
  } else {
    showThemedSwal({
      title: 'Visualização do PDF',
      html: `<iframe src="${url}" style="width:100%; height:70vh; border:none;"></iframe>`,
      width: '80%',
      showConfirmButton: false,
      showCloseButton: true,
      willClose: () => {
        URL.revokeObjectURL(url);
      }
    });
  }
}
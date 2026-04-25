/**
 * imageManagement.js
 * Gerencia a lista de imagens selecionadas no modo conversor.
 * Espelho intencional do fileManagement.js — mesma estrutura, escopo isolado.
 */

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function initImageManagement(imageInput, imageFileNames, convertBtn) {
  let imagesArray = [];

  // ─── Atualização da lista visual ───────────────────────────────────────────

  function updateImageList() {
    imageFileNames.innerHTML = '';

    imagesArray.forEach((file, index) => {
      const item = document.createElement('div');
      item.classList.add('sortable-item');
      item.dataset.index = index;
      item.draggable = true;

      const ext = getFileExtensionLabel(file);
      const badge = `<span class="badge-ext badge-${ext.toLowerCase()}">${ext}</span>`;

      item.innerHTML = `
        <span class="d-flex align-items-center gap-2">
          ${badge}
          <span class="file-name-text">${file.name}</span>
        </span>
        <i class="fas fa-trash-alt remove-file" data-index="${index}" title="Remover imagem"></i>
      `;

      imageFileNames.appendChild(item);
    });

    document.querySelectorAll('.remove-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        removeImage(index);
      });
    });

    convertBtn.disabled = imagesArray.length === 0;
  }

  // ─── Gerenciamento do array interno ────────────────────────────────────────

  function addImages(files) {
    const valid = Array.from(files).filter(isValidImage);
    const rejected = Array.from(files).length - valid.length;

    if (rejected > 0) {
      showThemedSwal({
        icon: 'warning',
        title: 'Formato não suportado',
        text: `${rejected} arquivo(s) ignorado(s). Apenas JPG, PNG e WEBP são aceitos.`
      });
    }

    imagesArray.push(...valid);
    syncInput();
    updateImageList();
  }

  function removeImage(index) {
    imagesArray.splice(index, 1);
    syncInput();
    updateImageList();
  }

  function syncInput() {
    const dt = new DataTransfer();
    imagesArray.forEach(f => dt.items.add(f));
    imageInput.files = dt.files;
  }

  function isValidImage(file) {
    const fileName = file.name.toLowerCase();
    return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  }

  function getFileExtensionLabel(file) {
    if (file.type?.includes('/')) {
      return file.type.split('/')[1].toUpperCase();
    }

    const extension = file.name.split('.').pop();
    return extension ? extension.toUpperCase() : 'IMG';
  }

  // ─── Event listeners ───────────────────────────────────────────────────────

  imageInput.addEventListener('change', (e) => {
    addImages(e.target.files);
    imageInput.value = '';
  });

  // Drag-and-drop na dropzone do conversor
  const imageDropzone = document.getElementById('imageDropzone');

  if (imageDropzone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      imageDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(evt => {
      imageDropzone.addEventListener(evt, () => imageDropzone.classList.add('active'));
    });

    ['dragleave', 'drop'].forEach(evt => {
      imageDropzone.addEventListener(evt, () => imageDropzone.classList.remove('active'));
    });

    imageDropzone.addEventListener('drop', (e) => {
      addImages(e.dataTransfer.files);
    });
  }

  // ─── Drag-and-drop para reordenação ────────────────────────────────────────

  if (window.Sortable) {
    new window.Sortable(imageFileNames, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd(evt) {
        const moved = imagesArray[evt.oldIndex];
        imagesArray.splice(evt.oldIndex, 1);
        imagesArray.splice(evt.newIndex, 0, moved);
        syncInput();
        updateImageList();
      }
    });
  } else {
    console.warn('Sortable nao foi carregado. A reordenacao de imagens ficara indisponivel.');
  }

  convertBtn.disabled = true;

  // Expõe o array para o conversor usar diretamente
  return {
    getImages: () => imagesArray
  };
}

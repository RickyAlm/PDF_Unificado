# PDF Tools

Aplicacao web para:

- Unificar multiplos PDFs em um unico arquivo
- Converter imagens (JPG, PNG e WEBP) em PDF

Tudo roda no navegador, sem upload para servidor.

## Acesso Online

Use diretamente em:

https://rickyalm.github.io/PDF_Unificado/

## Funcionalidades

### Modo 1: Unificar PDFs

- Seleciona varios PDFs por botao ou arrastar e soltar
- Permite reordenar os arquivos por drag-and-drop
- Permite visualizar todas as paginas dos PDFs carregados
- Permite reordenar as paginas livremente por drag-and-drop
- Permite remover paginas individuais antes da unificacao
- Permite remover itens individualmente
- Gera arquivo final com nome personalizado
- Permite visualizar o PDF gerado antes de baixar

### Modo 2: Imagens -> PDF

- Aceita arquivos JPG, JPEG, PNG e WEBP
- Suporta selecao por botao e drag-and-drop
- Permite reordenar imagens antes da conversao
- Permite remover itens individualmente
- Converte para PDF com uma imagem por pagina
- Permite visualizar o PDF gerado antes de baixar

### Interface

- Tema claro/escuro com persistencia
- Layout responsivo (desktop e mobile)
- Feedback visual de processamento com modais

## Tecnologias

- HTML5, CSS3, JavaScript (ES Modules)
- Bootstrap 5
- pdf-lib
- SortableJS
- SweetAlert2
- download.js
- Font Awesome

## Estrutura do Projeto

```
.
├── LICENSE
├── README.md
└── src
    ├── index.html
    └── assets
        ├── css
        │   └── style.css
        ├── fonts
        │   ├── CenturyGothic
        │   │   └── COPYRIGHT.txt
        │   └── Poppins
        │       └── OFL.txt
        ├── img
        └── js
            ├── core
            │   └── main.js
            ├── image
            │   └── imageToPdf.js
            ├── pdf
            │   ├── pdfMerger.js
            │   └── pdfViewer.js
            ├── ui
            │   ├── dragAndDrop.js
            │   ├── fileManagement.js
            │   ├── imageManagement.js
            │   ├── modeSelector.js
            │   └── themeManager.js
            └── utils
                └── index.js
```

## Como Usar Localmente

1. Clone o repositorio:

```bash
git clone https://github.com/RickyAlm/PDF_Unificado.git
```

2. Abra src/index.html em um navegador moderno.

Nao precisa instalar dependencias nem subir servidor.

## Privacidade

- Processamento local no navegador
- Nenhum arquivo enviado para servicos externos

## Observacoes

- Requer navegador moderno com suporte a ES Modules
- Arquivos grandes podem consumir bastante memoria do navegador

## Licenca

Projeto licenciado sob MIT.

- Century Gothic: ver arquivo de copyright em src/assets/fonts/CenturyGothic
- Poppins: SIL Open Font License 1.1 em src/assets/fonts/Poppins

## Contribuicoes

Pull requests e sugestoes sao bem-vindos.

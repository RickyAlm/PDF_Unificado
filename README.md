# Unificador de PDF
Aplicação web para unificação de múltiplos arquivos PDF em um único documento, com recursos avançados de personalização e numeração de páginas.

## 🌐 Acesso Online
A aplicação está disponível online e pode ser acessada diretamente através do link:

🔗 **https://rickyalm.github.io/PDF_Unificado/**

> Não é necessário instalar nada! Basta acessar o link e começar a usar imediatamente.

## 📋 Descrição do Projeto

Sistema completo para merge de arquivos PDF que permite:
- Seleção de múltiplos arquivos PDF via interface ou drag-and-drop
- Reordenação de arquivos através de arrastar e soltar
- Remoção individual de arquivos da lista
- Personalização do nome do arquivo final
- Adição opcional de numeração de páginas
- Controle de numeração na primeira página
- Pré-visualização do PDF unificado
- Alternância entre tema claro e escuro
- Processamento 100% client-side (sem upload para servidores)

## 🎯 Funcionalidades Principais

### Gerenciamento de Arquivos
- Upload múltiplo de arquivos PDF
- Drag-and-drop de arquivos
- Reordenação visual dos documentos
- Remoção individual de arquivos

### Configurações Avançadas
- Numeração automática de páginas
- Opção de incluir/excluir numeração na primeira página
- Personalização do nome do arquivo final
- Fonte customizável para numeração (Century Gothic)

### Interface
- Design responsivo e moderno
- Tema claro/escuro com persistência
- Feedback visual durante processamento
- Ícone secreto para acesso às configurações (5 cliques no ícone PDF)

## 🛠 Tecnologias Utilizadas

[![My Skills](https://skillicons.dev/icons?i=html,css,js,bootstrap)](https://skillicons.dev)

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Framework CSS**: Bootstrap 5.3.0
- **Bibliotecas JavaScript**:
  - [pdf-lib](https://pdf-lib.js.org/) - Manipulação de PDFs
  - [SortableJS](https://sortablejs.github.io/Sortable/) - Drag-and-drop
  - [SweetAlert2](https://sweetalert2.github.io/) - Alertas personalizados
  - [download.js](http://danml.com/download.html) - Download de arquivos
  - [fontkit](https://github.com/foliojs/fontkit) - Renderização de fontes
- **Ícones**: Font Awesome 6.4.0
- **Fontes**: Century Gothic, Poppins

## 📂 Estrutura do Projeto

```
├── src/
│   ├── index.html
│   └── assets/
│       ├── css/
│       │   └── style.css
│       ├── fonts/
│       │   ├── CenturyGothic/
│       │   │   ├── centurygothic_bold.ttf
│       │   │   ├── centurygothic.ttf
│       │   │   └── COPYRIGHT.txt
│       │   └── Poppins/
│       │       ├── OFL.txt
│       │       ├── Poppins-Regular.ttf
│       │       ├── Poppins-Bold.ttf
│       │       └── Poppins-Medium.ttf
│       ├── img/
│       │   └── favicon.ico
│       └── js/
│           ├── core/
│           │   └── main.js               # Inicialização da aplicação
│           ├── pdf/
│           │   ├── pdfMerger.js          # Processamento e merge dos PDFs
│           │   └── pdfViewer.js          # Visualização de PDFs
│           ├── ui/
│           │   ├── dragAndDrop.js        # Gerenciamento de drag-and-drop
│           │   ├── fileManagement.js     # Controle da lista de arquivos
│           │   ├── hideConfiguration.js  # Easter egg das configurações (ignorar)
│           │   ├── pagination.js         # Lógica de numeração de páginas
│           │   └── themeManager.js       # Gerenciamento de temas
│           └── utils/
│               └── index.js              # Funções utilitárias
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 Como Utilizar

### Instalação Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/RickyAlm/PDF_Unificado.git
   ```

2. Abra o arquivo index.html em um navegador moderno

3. Não é necessário servidor web ou instalação de dependências

### Uso da Aplicação

1. **Adicionar Arquivos**:
   - Clique em "Selecionar Arquivos" ou arraste os PDFs para a área de drop
   
2. **Organizar Documentos**:
   - Arraste e solte os arquivos para reordená-los
   - Clique no ícone de lixeira para remover arquivos indesejados

3. **Unificar**:
   - Digite um nome para o arquivo final
   - Clique em "Unificar PDFs"
   - Visualize o resultado ou faça o download

## 🎨 Recursos de Interface

### Tema Claro/Escuro
- Alternância via toggle no cabeçalho
- Preferência salva no localStorage
- Detecção automática de preferência do sistema
- Alertas e modais adaptados ao tema

### Responsividade
- Design adaptável para diferentes tamanhos de tela
- Otimizado para desktop, tablet e mobile

## 🔒 Privacidade e Segurança

- **Processamento 100% local**: Nenhum arquivo é enviado para servidores externos
- **Sem rastreamento**: Aplicação não coleta dados do usuário
- **Execução client-side**: Todo o processamento ocorre no navegador

## 📌 Observações

- A aplicação requer um navegador moderno com suporte a ES6 Modules
- Todos os arquivos são processados na memória do navegador
- Recomendado para arquivos de tamanho moderado (depende da memória disponível)
- As fontes Century Gothic e Poppins são licenciadas conforme seus respectivos arquivos de licença

## 📄 Licenças

Este projeto está sob a licença **MIT**. <br>
Uso livre para fins de **estudo e aprendizado**.

- **Century Gothic**: © The Monotype Corporation plc (ver COPYRIGHT.txt)
- **Poppins**: SIL Open Font License 1.1 (ver OFL.txt)

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

---

**Desenvolvido por:** Henrique Almeida <br>
**Repositório:** [github.com/RickyAlm/PDF_Unificado](github.com/RickyAlm/PDF_Unificado) <br>
**Demo Online:** [rickyalm.github.io/PDF_Unificado](rickyalm.github.io/PDF_Unificado)

---

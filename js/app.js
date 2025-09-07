// app.js - VERSÃO DEFINITIVA E MAIS ACESSÍVEL

document.addEventListener('DOMContentLoaded', () => {

  // --- SELETORES GLOBAIS ---
  const root = document.documentElement; 
  const body = document.body;
  const modal = document.getElementById('modal');
  const modalContent = document.querySelector('.modal-content');
  const closeBtn = document.querySelector('.close-btn');

  const themeToggleBtn = document.getElementById("theme-toggle");
  const searchInput = document.getElementById('search-input');
  const btnAumentarFonte = document.getElementById('aumentar-fonte');
  const btnDiminuirFonte = document.getElementById('diminuir-fonte');
  const btnAltoContraste = document.getElementById('alto-contraste');
  const grid = document.querySelector('.post-grid');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalAuthorDate = document.querySelector('.modal-author-date');
  const modalBody = document.querySelector('.modal-body');

  let postsData = [];
  let lastFocusedElement; 

  // --- FUNÇÕES DE ACESSIBILIDADE E TEMA ---
  const alterarFonte = (incremento) => {
      const estiloComputado = window.getComputedStyle(root); 
      let tamanhoAtual = parseFloat(estiloComputado.fontSize);
      let novoTamanho = tamanhoAtual + incremento;
      novoTamanho = Math.max(12, Math.min(novoTamanho, 24));
      root.style.fontSize = novoTamanho + 'px'; 
      localStorage.setItem('tamanhoFonte', root.style.fontSize);
  };

  const toggleAltoContraste = () => {
      body.classList.toggle('alto-contraste');
      const isAltoContrasteAtivo = body.classList.contains('alto-contraste');
      if (isAltoContrasteAtivo) {
          const currentTheme = root.getAttribute('data-theme');
          if (currentTheme) {
              localStorage.setItem('temaPreContraste', currentTheme);
          }
          root.removeAttribute('data-theme');
      } else {
          const temaSalvo = localStorage.getItem('temaPreContraste') || 'light';
          root.setAttribute('data-theme', temaSalvo);
      }
      localStorage.setItem('altoContrasteAtivo', isAltoContrasteAtivo);
  };

  const carregarPreferencias = () => {
      const temaSalvo = localStorage.getItem('theme');
      const tamanhoFonteSalvo = localStorage.getItem('tamanhoFonte');
      const altoContrasteAtivo = localStorage.getItem('altoContrasteAtivo') === 'true';

      if (altoContrasteAtivo) {
          body.classList.add('alto-contraste');
          root.removeAttribute('data-theme');
      } else if (temaSalvo) {
          root.setAttribute('data-theme', temaSalvo);
      }

      if (tamanhoFonteSalvo) {
          root.style.fontSize = tamanhoFonteSalvo;
      }
  };
// NOVA FUNÇÃO para formatar a data
const formatarData = (isoDate) => {
    // Adiciona uma verificação para evitar erros se a data não existir
    if (!isoDate) return ''; 

    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return new Date(isoDate).toLocaleDateString('pt-BR', options);
};
// Função utilitária para extrair texto do array de conteúdo
function extrairTextoConteudo(content) {
    if (!Array.isArray(content)) return '';
    return content.map(paragrafo => {
        if (paragrafo.children && Array.isArray(paragrafo.children)) {
            return paragrafo.children.map(child => child.text || '').join('');
        }
        return '';
    }).join(' ');
}
const renderCards = (posts) => {
      grid.innerHTML = '';
      posts.forEach(post => {
          const card = document.createElement('article');
          card.className = 'post-card';
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          card.innerHTML = `<h2>${post.title}</h2><p>${post.subtitle || post.content[0].substring(0, 90) + '...'}</p><span>${post.date}</span>`;
          
          card.addEventListener('click', () => abrirModal(post));
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              abrirModal(post);
            }
          });
          grid.appendChild(card);
      });
  };

  fetch('./posts.json').then(res => res.json()).then(posts => {
      postsData = posts;
      renderCards(posts);
  });
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filteredPosts = postsData.filter(post => {
        if (!post) return false;
        const { title, content } = post;
        const titleMatch = title && title.toLowerCase().includes(searchTerm);
        let contentMatch = false;
        if (Array.isArray(content)) {
            contentMatch = content.some(c => typeof c === 'string' && c.toLowerCase().includes(searchTerm));
        } else if (typeof content === 'string') {
            contentMatch = content.toLowerCase().includes(searchTerm);
        }
        return titleMatch || contentMatch;
    });
    renderCards(filteredPosts);
});

  // --- LÓGICA DO MODAL E FOCUS TRAP ---
  const handleFocusTrap = (e) => {
      if (e.key !== 'Tab') return;

      // Este seletor agora inclui o .modal-content (que terá tabindex="0")
      const focusableElements = Array.from(
          modal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
          }
      } else { // Tab
          if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
          }
      }
  };

  function abrirModal(post) {
    lastFocusedElement = document.activeElement;
    const { title, subtitle, author, date, content } = post;
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle || '';
    modalAuthorDate.textContent = `Por ${author} — ${formatarData(date)}`;
    modalImg.style.display = 'none';
    // Extrai e exibe o texto do conteúdo
    if (Array.isArray(content)) {
        modalBody.innerHTML = extrairTextoConteudo(content).replace(/\n/g, '<br>');
    } else {
        modalBody.innerHTML = content || '';
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalContent.setAttribute('tabindex', '0');
    modal.addEventListener('keydown', handleFocusTrap);
    closeBtn.focus();
}

  function fecharModal() {
      modal.removeEventListener('keydown', handleFocusTrap);
      modalContent.removeAttribute('tabindex');

      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      if (lastFocusedElement) {
          lastFocusedElement.focus();
      }
  }
  
  // --- EVENT LISTENERS GERAIS ---
  themeToggleBtn.addEventListener("click", () => {
      if (body.classList.contains('alto-contraste')) {
          alert('Desative o modo de Alto Contraste para alterar o tema.');
          return;
      }
      const currentTheme = root.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", newTheme);
      localStorage.setItem('theme', newTheme);
  });
  
  btnAumentarFonte.addEventListener('click', () => alterarFonte(2));
  btnDiminuirFonte.addEventListener('click', () => alterarFonte(-2));
  btnAltoContraste.addEventListener('click', toggleAltoContraste);
  closeBtn.addEventListener('click', fecharModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) fecharModal(); });

  // --- INICIALIZAÇÃO ---
  document.getElementById('current-year').textContent = new Date().getFullYear();
  carregarPreferencias();
});
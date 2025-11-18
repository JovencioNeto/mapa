const cardsContainer = document.getElementById("cards");

// Função para escapar HTML (evita XSS)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cria card de uma empresa
function criarCard(emp) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Ver detalhes de ${escapeHtml(emp.nome)}`);

  const imgSrc = emp.imagem ? `http://localhost:3000/uploads/${emp.imagem}` : '/img/default.png';

  card.innerHTML = `
    <img src="${imgSrc}" 
         alt="${escapeHtml(emp.nome)} - Logo do negócio" 
         class="card-img" 
         onerror="this.src='/img/default.png'" />
    <div class="card-content">
      <h3>${escapeHtml(emp.nome)}</h3>
      <p>${escapeHtml(emp.descricao || 'Descrição não informada')}</p>
      <p><strong>Categoria:</strong> ${escapeHtml(emp.categoria || 'Não informado')}</p>
      <p><strong>Tipos de Loja:</strong> ${escapeHtml(emp.tipoLoja || 'Não informado')}</p>
    </div>
  `;

  // Ao clicar, vai para o mapa destacando a empresa
  const handleClick = () => {
    window.location.href = `../index.html?empresaId=${emp.id}`;
  };

  card.addEventListener('click', handleClick);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  });

  return card;
}

// Carregar empresas
async function carregarEmpresas() {
  try {
    cardsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando empresas...</div>';

    const res = await fetch("http://localhost:3000/api/empreendedores");
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const empresas = await res.json();

    cardsContainer.innerHTML = "";

    if (!empresas || empresas.length === 0) {
      cardsContainer.innerHTML = "<p class='empty'>Nenhuma empresa cadastrada ainda. <a href='../pages/cadastro.html'>Cadastre a primeira!</a></p>";
      return;
    }

    empresas.forEach(emp => {
      const card = criarCard(emp);
      cardsContainer.appendChild(card);
    });

    console.log(`✅ ${empresas.length} empresas carregadas.`);
  } catch (err) {
    console.error("❌ Erro ao carregar:", err);
    cardsContainer.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Erro ao carregar as empresas: ${escapeHtml(err.message)}</p>
        <button onclick="carregarEmpresas()" class="btn-retry-again">Tentar Novamente</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', carregarEmpresas);

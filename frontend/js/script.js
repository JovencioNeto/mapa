const centro = [-4.0432, -39.4545];
const limites = L.latLngBounds(
  L.latLng(-4.08, -39.50),
  L.latLng(-4.00, -39.40)
);

let map = L.map("map", {
  center: centro,
  zoom: 14,
  maxBounds: limites,
  maxBoundsViscosity: 1.0
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

let markers = [];
let empreendedores = [];

const cardsContainer = document.getElementById("cards");

// Função para renderizar mapa e cards
function renderizar(data) {
  // Limpa marcadores e cards antigos
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  cardsContainer.innerHTML = "";

  data.forEach(emp => {
    const lat = parseFloat(emp.lat) || centro[0];
    const lng = parseFloat(emp.lng) || centro[1];

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>${emp.nome}</b><br>${emp.descricao || 'Não informado'}`);
    marker.on('click', () => window.location.href = `negocio.html?id=${emp.id}`);
    markers.push(marker);

    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${emp.imagem || 'img/default.png'}" alt="${emp.nome}">
      <div class="card-content">
        <h3>${emp.nome}</h3>
        <p>${emp.descricao || 'Não informado'}</p>
        <p><strong>Atendimento:</strong> ${emp.atendimento || 'Não informado'}</p>
      </div>
    `;
    card.onclick = () => window.location.href = `negocio.html?id=${emp.id}`;
    cardsContainer.appendChild(card);
  });
}

// Função de filtro local
function filtrar() {
  const busca = document.getElementById('search').value.toLowerCase();
  const categoria = document.getElementById('categoriaFilter').value;
  const atendimento = document.getElementById('atendimentoFilter').value;

  const filtrados = empreendedores.filter(emp => {
    const nomeDesc = (emp.nome + " " + (emp.descricao || "")).toLowerCase();
    const nomeMatch = nomeDesc.includes(busca);
    const catMatch = categoria ? emp.categoria === categoria : true;
    const atendMatch = atendimento ? emp.atendimento === atendimento : true;
    return nomeMatch && catMatch && atendMatch;
  });

  renderizar(filtrados);
}

// Carrega todos os empreendedores do backend
async function carregarEmpreendedores() {
  try {
    const res = await fetch("http://localhost:3000/api/empreendedores");
    if (!res.ok) throw new Error("Erro ao carregar empreendedores");
    empreendedores = await res.json();
    renderizar(empreendedores);
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados. Verifique se o backend está rodando.");
  }
}

// Eventos
document.getElementById("filterBtn").addEventListener("click", filtrar);
document.getElementById("search").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    filtrar();
  }
});

// Inicialização
window.onload = carregarEmpreendedores;

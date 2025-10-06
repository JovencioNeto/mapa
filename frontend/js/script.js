// ===== Configuração inicial do mapa =====
const centro = [-4.0432, -39.4545];
const limites = L.latLngBounds(
  L.latLng(-4.08, -39.50),
  L.latLng(-4.00, -39.40)
);


const map = L.map("map", {
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

// ===== Função para renderizar marcadores =====
function renderizar(data) {
  // Remove marcadores antigos
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(emp => {
    const lat = parseFloat(emp.lat) || centro[0];
    const lng = parseFloat(emp.lng) || centro[1];

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>${emp.nome}</b><br>${emp.descricao || 'Não informado'}`);

    // Clicar no marcador abre a página do negócio
    marker.on('click', () => {
      window.location.href = `negocio.html?id=${emp.id}`;
    });

    markers.push(marker);
  });
}

// ===== Função de filtro =====
function filtrar() {
  const busca = document.getElementById('search').value.toLowerCase();
  const categoria = document.getElementById('categoriaFilter').value;
  const tipoAtendimento = document.getElementById('atendimentoFilter').value;

  const filtrados = empreendedores.filter(emp => {
    const nomeDesc = (emp.nome + " " + (emp.descricao || "")).toLowerCase();
    const nomeMatch = nomeDesc.includes(busca);
    const catMatch = categoria ? emp.categoria === categoria : true;
    const tipoMatch = tipoAtendimento 
      ? (emp.tipoLoja || []).includes(tipoAtendimento.toLowerCase()) 
      : true;

    return nomeMatch && catMatch && tipoMatch;
  });

  renderizar(filtrados);
}

// ===== Carregar empreendedores do backend =====
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

// ===== Eventos =====
document.getElementById("filterBtn").addEventListener("click", filtrar);
document.getElementById("search").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    filtrar();
  }
});

// ===== Inicialização =====
window.onload = carregarEmpreendedores;

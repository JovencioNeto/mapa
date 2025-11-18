// ===== CONFIGURAÇÃO GLOBAL =====
const generalSampaio = [-4.044, -39.455];
const zoomCidade = 15;
const limitesBrasil = L.latLngBounds(
  L.latLng(-34.0, -74.0),
  L.latLng(5.0, -34.0)
);

let map;
let markers = [];
let nenhumPopup = null;
let empreendedores = [];
let userLatLng = null;

// ===== DADOS FALLBACK =====
const dadosFallback = [
  {
    id: 1, nome: "Padaria do Zé", categoria: "Alimentação",
    descricao: "Pães frescos e doces caseiros.",
    tipoLoja: "Físico", lat: -4.044, lng: -39.455,
    email: "padariaze@email.com", telefone: "(88) 1234-5678",
    diasFuncionamento: "Segunda a Sábado",
    horaInicio: "06:00", horaFim: "12:00",
    horaTardeInicio: "14:00", horaTardeFim: "18:00", imagem: null
  },
  {
    id: 2, nome: "Loja de Roupas Maria", categoria: "Moda",
    descricao: "Vestidos e acessórios femininos.",
    tipoLoja: "Delivery,Online", lat: -4.045, lng: -39.456,
    email: "lojamaria@email.com", telefone: "(88) 9876-5432",
    diasFuncionamento: "Segunda a Sexta",
    horaInicio: "08:00", horaFim: "12:00",
    horaTardeInicio: "14:00", horaTardeFim: "18:00", imagem: null
  }
];

// ===== UTILITÁRIOS =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== RENDERIZAÇÃO DE MARCADORES =====
function renderizar(data) {
  // Remove marcadores antigos
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  if (nenhumPopup) {
    map.closePopup(nenhumPopup);
    nenhumPopup = null;
  }

  if (!data || data.length === 0) {
    nenhumPopup = L.popup()
      .setLatLng(generalSampaio)
      .setContent('<p>Nenhum empreendedor encontrado.</p>')
      .openOn(map);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const empresaIdURL = parseInt(urlParams.get('empresaId'), 10);

  data.forEach(emp => {
    const lat = parseFloat(emp.lat);
    const lng = parseFloat(emp.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    let popupContent = `<div style="max-width:250px; font-size:14px">
      <b>${escapeHtml(emp.nome)}</b><br>
      <small><i class="fas fa-tag"></i> ${escapeHtml(emp.categoria)}</small><br>
      ${escapeHtml(emp.descricao || 'Descrição não informada')}<br>`;

    if (emp.imagem && emp.imagem !== "null") {
      popupContent += `<img src="http://localhost:3000/uploads/${escapeHtml(emp.imagem)}"
        alt="Foto" style="max-width:100px; border-radius:4px; margin:5px 0"
        onerror="this.style.display='none'">`;
    }

    if (emp.email || emp.telefone || emp.instagram) {
      popupContent += '<hr style="margin:5px 0">';
      if (emp.email) popupContent += `<i class="fas fa-envelope"></i> ${escapeHtml(emp.email)}<br>`;
      if (emp.telefone) popupContent += `<i class="fas fa-phone"></i> ${escapeHtml(emp.telefone)}<br>`;
      if (emp.instagram) popupContent += `<i class="fab fa-instagram"></i> ${escapeHtml(emp.instagram)}<br>`;
    }

    if (emp.diasFuncionamento || emp.horaInicio) {
      popupContent += '<hr style="margin:5px 0">';
      if (emp.diasFuncionamento) popupContent += `<i class="fas fa-calendar-alt"></i> ${escapeHtml(emp.diasFuncionamento)}<br>`;
      if (emp.horaInicio) {
        popupContent += `<i class="fas fa-clock"></i> Manhã ${escapeHtml(emp.horaInicio)} - ${escapeHtml(emp.horaFim || '')}`;
        if (emp.horaTardeInicio)
          popupContent += `<br><i class="fas fa-clock"></i> Tarde ${escapeHtml(emp.horaTardeInicio)} - ${escapeHtml(emp.horaTardeFim || '')}`;
      }
    }

    if (emp.tipoLoja) {
      const tipoStr = Array.isArray(emp.tipoLoja) ? emp.tipoLoja.join(", ") : emp.tipoLoja;
      popupContent += `<br><small><i class="fas fa-store"></i> ${escapeHtml(tipoStr)}</small>`;
    }

    popupContent += '</div>';

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(popupContent);

    marker.on('click', () => marker.openPopup());
    markers.push(marker);

    if (empresaIdURL && emp.id === empresaIdURL) {
      marker.openPopup();
      map.setView(marker.getLatLng(), 18);
    }
  });

  if (!userLatLng && markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [20, 20] });
  }
}

// ===== CARREGAR EMPREENDEDORES =====
async function carregarEmpreendedores() {
  const loadingDiv = L.DomUtil.create('div', 'loading-overlay', map.getContainer());
  loadingDiv.innerHTML = '<p><i class="fas fa-map-marker-alt fa-spin"></i> Carregando mapa...</p>';
  loadingDiv.style.cssText = `
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: white; padding: 20px; border-radius: 5px; z-index: 1000;
  `;
  loadingDiv.style.display = 'block';

  try {
    const res = await fetch("http://localhost:3000/api/empreendedores");
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const data = await res.json();
    empreendedores = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("⚠️ Backend offline. Usando fallback.");
    empreendedores = dadosFallback;
  } finally {
    loadingDiv.style.display = 'none';
  }

  renderizar(empreendedores);
}

// ===== APLICAR FILTROS =====
function aplicarFiltros() {
  const busca = (document.getElementById('search')?.value || '').toLowerCase();
  const categoria = (document.getElementById('categoriaFilter')?.value || '').toLowerCase();
  const tipoAtendimento = (document.getElementById('atendimentoFilter')?.value || '').toLowerCase();

  const filtrados = empreendedores.filter(emp => {
    const nomeDesc = (emp.nome + " " + (emp.descricao || "")).toLowerCase();
    const nomeMatch = nomeDesc.includes(busca);
    const catMatch = categoria ? emp.categoria.toLowerCase() === categoria : true;

    let tipoMatch = true;
    if (tipoAtendimento) {
      const tipos = (emp.tipoLoja || '').split(',').map(t => t.trim().toLowerCase());
      tipoMatch = tipos.includes(tipoAtendimento);
    }

    return nomeMatch && catMatch && tipoMatch;
  });

  renderizar(filtrados);
}

// ===== SINCRONIZAR FILTROS DESKTOP/MOBILE =====
function sincronizarFiltros() {
  const sync = (desktopId, mobileId) => {
    const desktop = document.getElementById(desktopId);
    const mobile = document.getElementById(mobileId);
    if (desktop && mobile) {
      desktop.addEventListener('input', () => mobile.value = desktop.value);
      mobile.addEventListener('input', () => desktop.value = mobile.value);
      desktop.addEventListener('change', () => mobile.value = desktop.value);
      mobile.addEventListener('change', () => desktop.value = mobile.value);
    }
  };

  sync('search', 'search-mobile');
  sync('categoriaFilter', 'categoriaFilter-mobile');
  sync('atendimentoFilter', 'atendimentoFilter-mobile');
}

// ===== VINCULAR EVENTOS =====
function bindEventos() {
  ['search', 'categoriaFilter', 'atendimentoFilter', 'search-mobile', 'categoriaFilter-mobile', 'atendimentoFilter-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', aplicarFiltros);
      el.addEventListener('change', aplicarFiltros);
    }
  });
}

// ===== CONFIGURAR GEOLOCALIZAÇÃO =====
function setupGeolocation() {
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    carregarEmpreendedores();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      userLatLng = [latitude, longitude];

      const userIcon = L.divIcon({ className: 'pulse-user', iconSize: [16,16], iconAnchor: [8,8] });
      L.marker(userLatLng, { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Você está aqui</b><br>Precisão: ±${Math.round(accuracy)}m`)
        .openPopup();

      map.setView(userLatLng, 15);
      carregarEmpreendedores();
    },
    err => {
      console.warn("Erro ao obter localização:", err);
      alert("Não foi possível obter sua localização. Usando posição padrão.");
      carregarEmpreendedores();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}


// ====================================================================================
//                ✨ FUNÇÃO ADICIONADA — BLOQUEAR SCROLL QUANDO MENU ABRE
// ====================================================================================
function bloquearScroll(ativo) {
  document.body.style.overflow = ativo ? "hidden" : "auto";
}

// ===== CONFIGURAR MENU MOBILE =====
function setupMenuToggle() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const closeMenu = document.querySelector('.close-menu'); // <- ADICIONADO
  const main = document.querySelector('main');
  const body = document.body;

  if (!menuToggle || !navMobile) return;

  // Abrir/fechar menu com o botão hamburguer
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMobile.classList.toggle('open');
    main.classList.toggle('shifted');
    menuToggle.classList.toggle('open');
    body.classList.toggle('menu-open');

    bloquearScroll(body.classList.contains('menu-open'));
  });

  // === FECHAR MENU PELO X ===
  if (closeMenu) {
    closeMenu.addEventListener('click', (e) => {
      e.stopPropagation();

      navMobile.classList.remove('open');
      main.classList.remove('shifted');
      menuToggle.classList.remove('open');
      body.classList.remove('menu-open');

      bloquearScroll(false);
    });
  }

  // Fechar ao clicar fora do menu
  document.addEventListener('click', (e) => {
    if (!navMobile.contains(e.target) && !menuToggle.contains(e.target)) {
      navMobile.classList.remove('open');
      main.classList.remove('shifted');
      menuToggle.classList.remove('open');
      body.classList.remove('menu-open');

      bloquearScroll(false);
    }
  });
}


// ===== INICIALIZAÇÃO DO MAPA =====
function initMap() {
  if (typeof L === 'undefined') {
    alert("❌ Leaflet não carregado!");
    return;
  }

  map = L.map("map", {
    center: generalSampaio,
    zoom: zoomCidade,
    maxBounds: limitesBrasil,
    maxBoundsViscosity: 0.8
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  setupGeolocation();
  bindEventos();
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  sincronizarFiltros();
  setupMenuToggle();
});

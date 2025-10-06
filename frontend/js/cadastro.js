// ================= MAPA =================
const centro = [-4.0432, -39.4545]; // Coordenadas iniciais
const map = L.map("map").setView(centro, 14);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let marker;
map.on("click", e => {
  const { lat, lng } = e.latlng;
  if (marker) {
    marker.setLatLng(e.latlng);
  } else {
    marker = L.marker(e.latlng).addTo(map);
  }
  marker.bindPopup(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
  document.getElementById("lat").value = lat;
  document.getElementById("lng").value = lng;
});

// ================= UPLOAD =================
const inputImagem = document.getElementById("imagem");
const fileName = document.getElementById("fileName");

inputImagem.addEventListener("change", () => {
  if (inputImagem.files.length > 0) {
    fileName.textContent = inputImagem.files[0].name;
    fileName.style.opacity = "1";
  } else {
    fileName.textContent = "Nenhum arquivo selecionado";
    fileName.style.opacity = "0.6";
  }
  fileName.style.display = "inline";
});

// ================= CADASTRO =================
document.getElementById("cadastroForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById("buttonSubmit");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const horaInicio = form.horaInicio?.value;
    const horaFim = form.horaFim?.value;
    if (!horaInicio || !horaFim) throw new Error("Informe o horário de funcionamento.");

    const [hiH, hiM] = horaInicio.split(":").map(Number);
    const [hfH, hfM] = horaFim.split(":").map(Number);
    if ((hfH * 60 + hfM) <= (hiH * 60 + hiM)) {
      alert("O horário final deve ser maior que o inicial.");
      btn.disabled = false; btn.textContent = "Cadastrar";
      return;
    }

    if (!form.lat.value || !form.lng.value) {
      alert("Clique no mapa para marcar a localização.");
      btn.disabled = false; btn.textContent = "Cadastrar";
      return;
    }

    const diasSelecionados = Array.from(
      form.querySelectorAll('input[name="dias"]:checked')
    ).map(i => i.value);

    if (diasSelecionados.length === 0) {
      alert("Selecione pelo menos um dia de funcionamento.");
      btn.disabled = false; btn.textContent = "Cadastrar";
      return;
    }

    const tiposSelecionados = Array.from(
      form.querySelectorAll('input[name="tipoLoja"]:checked')
    ).map(i => i.value);

    if (tiposSelecionados.length === 0) {
      alert("Selecione pelo menos um tipo de loja.");
      btn.disabled = false; btn.textContent = "Cadastrar";
      return;
    }

    const formData = new FormData(form);
    formData.set("diasFuncionamento", JSON.stringify(diasSelecionados));
    formData.set("tipoLoja", JSON.stringify(tiposSelecionados));

    // ================= FETCH =================
    const res = await fetch("/api/empreendedores", {
      method: "POST",
      body: formData
    });

    // Verifica se o retorno é JSON
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error("Resposta inesperada do servidor:", text);
      alert("Erro ao cadastrar: resposta inesperada do servidor");
      btn.disabled = false;
      btn.textContent = "Cadastrar";
      return;
    }

    if (res.ok) {
      alert(data.message || "Cadastro realizado com sucesso!");
      form.reset();
      if (marker) map.removeLayer(marker);
      window.location.href = "/index.html"; // ajustado para relativo
    } else {
      alert("Erro ao cadastrar: " + (data.error || "Tente novamente."));
    }
  } catch (err) {
    console.error("Erro no cadastro front:", err);
    alert("Erro ao cadastrar: " + (err.message || "Verifique o console."));
  } finally {
    btn.disabled = false;
    btn.textContent = "Cadastrar";
  }
});

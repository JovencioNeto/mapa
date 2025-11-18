// '// ====================== INICIALIZAÇÃO ======================'
document.addEventListener('DOMContentLoaded', function() {
  // ====================== MAPA ======================
  const centroGeneralSampaio = [-3.95, -39.15];
  const map = L.map("map").setView(centroGeneralSampaio, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
  }).addTo(map);

  let marker;
  map.on("click", e => {
    const { lat, lng } = e.latlng;
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);

    marker.bindPopup(`Localização: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`).openPopup();
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;
  }); 

  // Geolocalização automática
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 13);
      document.getElementById("lat").value = latitude;
      document.getElementById("lng").value = longitude;
      if (!marker) {
        marker = L.marker([latitude, longitude]).addTo(map)
          .bindPopup("Sua localização atual").openPopup();
      }
    }, () => {
      if (!marker) {
        marker = L.marker(centroGeneralSampaio).addTo(map)
          .bindPopup("Centro de General Sampaio (fallback)").openPopup();
        document.getElementById("lat").value = centroGeneralSampaio[0];
        document.getElementById("lng").value = centroGeneralSampaio[1];
      }
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  } else {
    if (!marker) {
      marker = L.marker(centroGeneralSampaio).addTo(map)
        .bindPopup("Centro de General Sampaio").openPopup();
      document.getElementById("lat").value = centroGeneralSampaio[0];
      document.getElementById("lng").value = centroGeneralSampaio[1];
    }
  }

  // ====================== FUNÇÃO DE ERRO COM SCROLL ======================
  function showError(inputOrSpanId, msg) {
    const el = typeof inputOrSpanId === 'string' ? document.getElementById(inputOrSpanId) : inputOrSpanId;
    if (!el) return;
    
    let span;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      span = document.getElementById(el.id + '-error');
      el.classList.toggle('error', !!msg);
    } else { // span direto
      span = el;
    }

    if (span) span.textContent = msg || '';

    // Scroll seguro
    if (msg) {
      if (el.id === 'map') {
        document.getElementById('cadastroForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        map.invalidateSize();
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el.focus) el.focus({ preventScroll: true });
      }
    }
  }

  // ====================== UPLOAD DE IMAGEM ======================
  const inputImagem = document.getElementById("imagem");
  const fileName = document.getElementById("fileName");

  inputImagem.addEventListener("change", () => {
    if (inputImagem.files.length > 0) {
      const file = inputImagem.files[0];
      fileName.textContent = file.name;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        showError("imagem-error", "Formato inválido. Use JPEG, PNG, WebP ou GIF.");
        inputImagem.value = "";
        fileName.textContent = "Nenhum arquivo selecionado";
        return;
      } else showError("imagem-error", "");

      if (file.size > 5 * 1024 * 1024) {
        showError("imagem-error", "Arquivo muito grande (máx 5MB).");
        inputImagem.value = "";
        fileName.textContent = "Nenhum arquivo selecionado";
      } else showError("imagem-error", "");
    } else {
      fileName.textContent = "Nenhum arquivo selecionado";
      showError("imagem-error", "");
    }
  });

  // ====================== VALIDAÇÃO TELEFONE ======================
  function validarTelefone(telefone) {
    const regex = /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    return regex.test(telefone);
  }

  // ====================== SUBMIT FORM ======================
  const form = document.getElementById("cadastroForm");
  const btn = document.getElementById("buttonSubmit");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    document.querySelectorAll('.error-message').forEach(span => span.textContent = '');
    btn.disabled = true;
    btn.textContent = "Enviando...";

    function resetBtn() {
      btn.disabled = false;
      btn.textContent = "Cadastrar";
    }

    try {
      // ====================== VALIDAÇÃO NA ORDEM DO FORM ======================
      // 1. Nome
      const nome = form.nome.value.trim();
      if (!nome || nome.length < 3) {
        showError(form.nome, "Nome deve ter pelo menos 3 caracteres.");
        return resetBtn();
      }

      // 2. Categoria
      const categoria = form.categoria.value;
      if (!categoria) {
        showError(form.categoria, "Selecione uma categoria.");
        return resetBtn();
      }

      // 3. Tipo de loja
      const tiposSelecionados = Array.from(form.querySelectorAll('input[name="tipoLoja[]"]:checked')).map(i => i.value);
      if (tiposSelecionados.length === 0) {
        showError("tipoLoja-error", "Selecione pelo menos um tipo de loja.");
        return resetBtn();
      }

      // 4. Imagem/Logo
      if (!inputImagem.files.length) {
        showError("imagem-error", "Selecione uma foto/logo.");
        return resetBtn();
      }

      // 5. Descrição
      const descricao = form.descricao.value.trim();
      if (!descricao) {
        showError(form.descricao, "Descrição é obrigatória.");
        return resetBtn();
      }

      // 6. Endereço
      const endereco = form.endereco.value.trim();
      if (!endereco) {
        showError(form.endereco, "Endereço é obrigatório.");
        return resetBtn();
      }

      // 7. Email
      const email = form.email.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(form.email, "Email inválido.");
        return resetBtn();
      }

      // 8. Telefone
      const telefone = form.telefone.value;
      if (!telefone || !validarTelefone(telefone)) {
        showError(form.telefone, "Formato de telefone inválido.");
        return resetBtn();
      }

      // 9. Instagram (opcional)
      const instagram = form.instagram.value.trim();

      // 10. Dias de funcionamento
      const diasSelecionados = Array.from(form.querySelectorAll('input[name="dias[]"]:checked')).map(i => i.value);
      if (diasSelecionados.length === 0) {
        showError("dias-error", "Selecione pelo menos um dia.");
        return resetBtn();
      }

      // 11. Horários manhã
      const horaInicio = form.horaInicio.value;
      const horaFim = form.horaFim.value;
      if (!horaInicio || !horaFim) {
        showError("horaManha-error", "Informe o horário da manhã.");
        return resetBtn();
      }
      const [hiH, hiM] = horaInicio.split(":").map(Number);
      const [hfH, hfM] = horaFim.split(":").map(Number);
      if ((hfH*60+hfM) <= (hiH*60+hiM)) {
        showError("horaManha-error", "O horário final deve ser maior que o inicial.");
        return resetBtn();
      }

      // 12. Horário tarde (opcional)
      const horaTardeInicio = form.horaTardeInicio.value;
      const horaTardeFim = form.horaTardeFim.value;
      if (horaTardeInicio && horaTardeFim) {
        const [htiH, htiM] = horaTardeInicio.split(":").map(Number);
        const [htfH, htfM] = horaTardeFim.split(":").map(Number);
        if ((htfH*60+htfM) <= (htiH*60+htiM)) {
          showError("horaTarde-error", "O horário final da tarde deve ser maior que o inicial.");
          return resetBtn();
        }
      }

      // 13. Localização no mapa
      const lat = parseFloat(form.lat.value);
      const lng = parseFloat(form.lng.value);
      if (isNaN(lat) || isNaN(lng)) {
        showError("map-error", "Clique no mapa ou preencha o endereço.");
        return resetBtn();
      }

      if (!confirm("Confirma o cadastro do negócio?")) return resetBtn();

      // ====================== ENVIO PARA API ======================
      const formData = new FormData(form);
      formData.delete("dias[]");
      formData.delete("tipoLoja[]");
      formData.set("diasFuncionamento", JSON.stringify(diasSelecionados));
      formData.set("tipoLoja", JSON.stringify(tiposSelecionados));

      const res = await fetch("http://localhost:3000/api/empreendedores", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Cadastro realizado com sucesso!");
        form.reset();
        if (marker) map.removeLayer(marker);
        map.setView(centroGeneralSampaio, 13);
        fileName.textContent = "Nenhum arquivo selecionado";
      } else {
        throw new Error(data.error || "Erro no cadastro");
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar: " + (err.message || "Tente novamente."));
    } finally {
      btn.disabled = false;
      btn.textContent = "Cadastrar";
    }
  });
});

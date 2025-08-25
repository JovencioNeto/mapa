document.getElementById("cadastroForm").addEventListener("submit", async function(e) {
  e.preventDefault(); // impede envio real

  const form = e.target;

  // Pega dias selecionados
  const diasSelecionados = Array.from(form.querySelectorAll('input[name="dias"]:checked'))
                                .map(input => input.value);

  // Prepara FormData para envio (inclui imagem)
  const formData = new FormData(form);
  formData.append("diasFuncionamento", JSON.stringify(diasSelecionados));

  // Mostra dados no console antes de enviar
  const dados = {
    nome: form.nome.value.trim(),
    categoria: form.categoria.value,
    descricao: form.descricao.value.trim(),
    endereco: form.endereco.value.trim(),
    lat: form.lat.value,
    lng: form.lng.value,
    email: form.email.value.trim(),
    telefone: form.telefone.value.trim(),
    whatsapp: form.whatsapp.value.trim(),
    instagram: form.instagram.value.trim(),
    diasFuncionamento: diasSelecionados,
    horaInicio: form.horaInicio.value,
    horaFim: form.horaFim.value,
    lojaVirtual: form.lojaVirtualCheck.checked,
    linkLojaVirtual: form.linkLojaVirtual.value.trim(),
    imagem: form.imagem.files[0] || null
  };
  console.log("Dados coletados do formulário:", dados);

  // Enviar para backend local
  try {
    const res = await fetch("http://localhost:3000/api/empreendedores", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      alert("Cadastro realizado com sucesso!");
      form.reset(); // Limpa formulário
      // Opcional: remover marker do mapa, esconder campo loja virtual etc.
    } else {
      const error = await res.json();
      alert("Erro ao cadastrar: " + (error.error || "Tente novamente."));
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão. Verifique se o backend está rodando.");
  }
});

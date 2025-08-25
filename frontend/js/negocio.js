const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  alert("ID do negócio não informado");
  window.location.href = "index.html";
}

// Ajuste para backend local
fetch(`http://localhost:3000/api/empreendedores/${id}`)
  .then(res => {
    if (!res.ok) throw new Error("Negócio não encontrado");
    return res.json();
  })
  .then(emp => {
    document.getElementById("nome").textContent = emp.nome;
    
    const imagemEl = document.getElementById("imagem");
    if (emp.imagem) {
      imagemEl.src = emp.imagem;
      imagemEl.alt = emp.nome;
    } else {
      imagemEl.src = "img/placeholder.png"; // caso não haja imagem
      imagemEl.alt = "Imagem não disponível";
    }

    document.getElementById("descricao").textContent = emp.descricao;
    document.getElementById("categoria").textContent = emp.categoria;
    document.getElementById("horario").textContent = `${emp.horaInicio} - ${emp.horaFim}`;

    // Endereço com link Google Maps
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emp.endereco || "")}`;
    const enderecoEl = document.getElementById("endereco");
    if (emp.endereco) {
      enderecoEl.href = gmapsUrl;
      enderecoEl.textContent = emp.endereco;
    } else {
      enderecoEl.textContent = "Não informado";
      enderecoEl.removeAttribute("href");
    }

    // Contatos
    const telefoneEl = document.getElementById("telefone");
    if (emp.telefone) {
      telefoneEl.href = `tel:${emp.telefone}`;
      telefoneEl.textContent = emp.telefone;
    } else {
      telefoneEl.textContent = "Não informado";
      telefoneEl.removeAttribute("href");
    }

    const emailEl = document.getElementById("email");
    if (emp.email) {
      emailEl.href = `mailto:${emp.email}`;
      emailEl.textContent = emp.email;
    } else {
      emailEl.textContent = "Não informado";
      emailEl.removeAttribute("href");
    }

    const whatsappEl = document.getElementById("whatsapp");
    if (emp.whatsapp) {
      whatsappEl.href = `https://wa.me/${emp.whatsapp.replace(/\D/g,'')}`;
      whatsappEl.textContent = emp.whatsapp;
    } else {
      whatsappEl.textContent = "Não informado";
      whatsappEl.removeAttribute("href");
    }

    const instaEl = document.getElementById("instagram");
    if (emp.instagram) {
      instaEl.href = `https://instagram.com/${emp.instagram.replace(/^@/, '')}`;
      instaEl.textContent = emp.instagram.startsWith("@") ? emp.instagram : `@${emp.instagram}`;
    } else {
      instaEl.textContent = "Não informado";
      instaEl.removeAttribute("href");
    }

    // Loja virtual
    const lojaEl = document.getElementById("lojaVirtual");
    const lojaContainer = document.getElementById("lojaVirtualContainer");
    if (emp.lojaVirtualLink) {
      lojaEl.href = emp.lojaVirtualLink;
      lojaEl.textContent = emp.lojaVirtualLink;
    } else {
      lojaContainer.style.display = "none";
    }

    // Compartilhar WhatsApp
    document.getElementById("btnCompartilhar").onclick = () => {
      const contato = emp.whatsapp || emp.telefone || "não informado";
      const texto = `Confira o negócio "${emp.nome}" - ${emp.descricao} - Contato: ${contato} - Endereço: ${emp.endereco || 'não informado'}`;
      const url = encodeURIComponent(window.location.href);
      const msg = encodeURIComponent(texto + "\n" + url);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    };
  })
  .catch(err => {
    console.error(err);
    alert(err.message);
    window.location.href = "index.html";
  });

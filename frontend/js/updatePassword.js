// updatePassword.js
(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const status = document.getElementById('status');
  const desc = document.getElementById('desc');
  const form = document.getElementById('updateForm');
  const btn = document.getElementById('btnSalvar');

  function setStatus(msg = '', type = '') {
    status.textContent = msg;
    status.className = 'status ' + type;
  }

  // ============================
  // 1) Validar token na abertura
  // ============================
  if (!token) {
    desc.textContent = 'Link inválido.';
    setStatus('Token não encontrado.', 'error');
    form.style.display = 'none';
  } else {
    fetch(`/api/validar-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          desc.textContent = `Redefinir senha para o e-mail: ${data.email}`;
        } else {
          desc.textContent = 'Token inválido ou expirado.';
          setStatus(data.error || 'Token inválido.', 'error');
          form.style.display = 'none';
        }
      })
      .catch(() => {
        desc.textContent = 'Erro ao validar token.';
        setStatus('Falha de comunicação com o servidor.', 'error');
        form.style.display = 'none';
      });
  }

  // ============================
  // 2) Enviar nova senha
  // ============================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const senha = document.getElementById('senha').value.trim();
    const confirm = document.getElementById('confirm').value.trim();

    if (senha.length < 6) {
      setStatus('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (senha !== confirm) {
      setStatus('As senhas não coincidem.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      const res = await fetch('/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: senha })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('Senha atualizada com sucesso!', 'success');
        form.reset();

        // redireciona para login após 3s
        setTimeout(() => {
          window.location.href = '/pages/login.html';
        }, 3000);

      } else {
        setStatus(data.error || 'Erro ao redefinir senha.', 'error');
      }

    } catch (err) {
      console.error(err);
      setStatus('Erro de conexão.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar nova senha';
    }
  });
})();

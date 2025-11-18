// recoverPassword.js
(() => {
  const form = document.getElementById('recuperarForm');
  const status = document.getElementById('status');
  const btn = document.getElementById('btnEnviar');

  function setStatus(msg = '', type = '') {
    status.textContent = msg;
    status.className = 'status ' + type;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const email = (form.email.value || '').trim();
    if (!email) {
      setStatus('Informe um e-mail válido.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch('/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus(data.message || 'Verifique seu e-mail (confira o spam).', 'success');
        form.reset();
      } else {
        setStatus(data.error || 'Erro ao enviar o e-mail.', 'error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Erro de conexão com o servidor.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar link de recuperação';
    }
  });
})();

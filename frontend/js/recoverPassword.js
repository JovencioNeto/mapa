
// Script mínimo: faz POST para a rota /api/recuperar-senha
(function () {
    const form = document.getElementById('recuperarForm')
    const status = document.getElementById('status')
    const btn = document.getElementById('btnEnviar')

    function setStatus(message, type = 'info') {
    status.textContent = message
    status.className = 'status ' + type
    }

    form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setStatus('', '') // limpa
    const email = form.email.value.trim()
    if (!email) {
        setStatus('Informe um e-mail válido.', 'error')
        return
    }

    btn.disabled = true
    btn.textContent = 'Enviando...'

    try {
        // Altere a URL abaixo para a rota do seu backend
        const res = await fetch('/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
        })

        const contentType = res.headers.get('content-type') || ''
        let data = {}
        if (contentType.includes('application/json')) data = await res.json()

        if (res.ok) {
        setStatus(data.message || 'E-mail enviado! Verifique sua caixa de entrada.', 'success')
        form.reset()
        } else {
        setStatus(data.error || 'Erro ao enviar e-mail. Tente novamente.', 'error')
        }
    } catch (err) {
        console.error(err)
        setStatus('Erro de conexão. Verifique o servidor.', 'error')
    } finally {
        btn.disabled = false
        btn.textContent = 'Enviar link de recuperação'
    }
    })
})()
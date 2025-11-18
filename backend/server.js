// ====================== IMPORTS ======================
const express = require("express")
const multer = require("multer")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")

// ====================== CONFIGURAÇÕES ======================
const app = express()
const PORT = 3000

// Pasta de uploads
const uploadDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Serve o front-end (ajuste se sua pasta for diferente, ex: './public' se tudo junto)
const frontendDir = path.join(__dirname, "../frontend")
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir))
} else {
  console.warn("⚠️  Pasta frontend não encontrada. Ajuste o path em frontendDir.")
}

// ====================== MIDDLEWARES ======================
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Live Server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))// Restrito para dev
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static(uploadDir))

// ====================== BANCO DE DADOS ======================
const dbPath = path.join(__dirname, "banco.db")
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message)
    process.exit(1) // Para se BD falhar
  } else {
    console.log("💾 Banco de dados conectado:", dbPath)
  }

  // Cria/atualiza tabela com verificação de schema
  db.run(`
    CREATE TABLE IF NOT EXISTS empreendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,
      endereco TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      horaInicio TEXT NOT NULL,
      horaFim TEXT NOT NULL,
      horaTardeInicio TEXT,
      horaTardeFim TEXT,
      diasFuncionamento TEXT,
      tipoLoja TEXT,
      telefone TEXT,
      email TEXT,
      instagram TEXT,
      imagem TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Erro ao criar tabela:", err.message)
    } else {
      console.log("💾 Tabela 'empreendedores' criada ou já existia.")
    }

    


    // Verifica e adiciona colunas faltantes (usando PRAGMA para schema)
    db.all("PRAGMA table_info(empreendedores)", (err, rows) => {
      if (err) {
        console.error("❌ Erro ao verificar schema:", err)
        return
      }
      const colunasExistentes = rows.map(r => r.name)
      const colunasParaAdicionar = [
        { nome: 'horaTardeInicio', tipo: 'TEXT' },
        { nome: 'horaTardeFim', tipo: 'TEXT' },
        { nome: 'created_at', tipo: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
      ]

      colunasParaAdicionar.forEach(col => {
        if (!colunasExistentes.includes(col.nome)) {
          const sql = `ALTER TABLE empreendedores ADD COLUMN ${col.nome} ${col.tipo}`
          db.run(sql, (err) => {
            if (err) {
              console.error(`❌ Erro ao adicionar coluna ${col.nome}:`, err.message)
            } else {
              console.log(`✅ Coluna ${col.nome} adicionada.`)
            }
          })
        } else {
          console.log(`✅ Coluna ${col.nome} já existe.`)
        }
      })
    })
  })
})

// ====================== UPLOAD (MULTER) ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueName + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF."), false)
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB para imagens melhores
})

// ====================== FUNÇÕES AUXILIARES ======================
// Validação de email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validação de telefone (formato BR simples)
function validarTelefone(telefone) {
  const regex = /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/
  return regex.test(telefone)
}

// ====================== ROTAS ======================
// GET: Listar todos
app.get("/api/empreendedores", (req, res) => {
  db.all("SELECT * FROM empreendedores ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("❌ Erro no GET all:", err.message)
      return res.status(500).json({ error: "Erro ao buscar dados do banco" })
    }
    console.log(`📊 ${rows.length} empreendedores carregados.`)
    res.json(rows)
  })
})

// GET: Por ID
app.get("/api/empreendedores/:id", (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "ID inválido (deve ser um número positivo)" })
  }
  db.get("SELECT * FROM empreendedores WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("❌ Erro no GET by ID:", err.message)
      return res.status(500).json({ error: "Erro ao buscar registro" })
    }
    if (!row) {
      return res.status(404).json({ error: "Negócio não encontrado" })
    }
    console.log(`🔍 Empreendedor ${id} carregado.`)
    res.json(row)
  })
})

// POST: Cadastrar
app.post("/api/empreendedores", upload.single("imagem"), (req, res) => {
  try {
    const {
      nome, descricao, categoria, endereco, lat, lng,
      horaInicio, horaFim, horaTardeInicio, horaTardeFim,
      diasFuncionamento, tipoLoja,
      telefone, email, instagram
    } = req.body

    // Validações obrigatórias
    if (!nome || nome.trim().length < 3) {
      return res.status(400).json({ error: "Nome do negócio deve ter pelo menos 3 caracteres." })
    }
    if (!categoria || !['Alimentação', 'Moda', 'Serviços', 'Tecnologia', 'Saúde', 'Outro'].includes(categoria)) {
      return res.status(400).json({ error: "Categoria inválida ou obrigatória." })
    }
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ error: "Coordenadas de localização inválidas." })
    }
    if (!horaInicio || !horaFim) {
      return res.status(400).json({ error: "Horário de funcionamento (manhã) é obrigatório." })
    }
    if (!req.file) {
      return res.status(400).json({ error: "Foto/Logo é obrigatória." })
    }

    // Validações opcionais
    if (email && !validarEmail(email)) {
      return res.status(400).json({ error: "Formato de email inválido." })
    }
    if (telefone && !validarTelefone(telefone)) {
      return res.status(400).json({ error: "Formato de telefone inválido (ex: (11) 9999-9999)." })
    }

    // ===== Normalização de arrays recebidos =====
    function normalizarCampoArray(campo) {
      if (!campo) return ''

      // Caso venha como JSON válido
      try {
        const arr = JSON.parse(campo)
        if (Array.isArray(arr)) return arr.join(', ')
      } catch (e) {}

      // Caso venha como objeto (erro de frontend)
      if (typeof campo === 'object') {
        try {
          return Object.values(campo).join(', ')
        } catch {
          return ''
        }
      }

      // Caso venha como string simples separada por vírgula
      if (typeof campo === 'string' && campo.includes(',')) {
        return campo.split(',').map(p => p.trim()).join(', ')
      }

      return campo.toString()
    }

    const diasFmt = normalizarCampoArray(diasFuncionamento)
    const tipoLojaFmt = normalizarCampoArray(tipoLoja)


    const imagem = req.file.filename

  
    const sql = `
      INSERT INTO empreendedores (
        nome, descricao, categoria, endereco, lat, lng,
        horaInicio, horaFim, horaTardeInicio, horaTardeFim,
        diasFuncionamento, tipoLoja, telefone, email, instagram, imagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      nome.trim(), descricao || null, categoria, endereco || null, latNum, lngNum,
      horaInicio, horaFim, horaTardeInicio || null, horaTardeFim || null,
      diasFmt, tipoLojaFmt, telefone || null, email || null, instagram || null, imagem
    ]



    db.run(sql, params, function(err) {
      if (err) {
        console.error("❌ Erro no INSERT:", err.message)
        console.error("🔍 Params enviados:", params)  // Log extra para debug
        return res.status(500).json({ error: "Erro ao salvar no banco: " + err.message })
      }
      console.log(`✅ Cadastro realizado: ID ${this.lastID} - ${nome}`)
      res.status(201).json({ id: this.lastID, message: "Cadastro realizado com sucesso!" })
    })
  } catch (err) {
    console.error("❌ Erro geral no POST:", err.message)
    res.status(500).json({ error: "Erro interno no servidor. Verifique os logs." })
  }
})

// DELETE: Opcional, para remover (use com autenticação em prod)
app.delete("/api/empreendedores/:id", (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })
  db.get("SELECT imagem FROM empreendedores WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Não encontrado" })
    // Deleta imagem se existir
    if (row.imagem) {
      const imgPath = path.join(uploadDir, row.imagem)
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    }
    db.run("DELETE FROM empreendedores WHERE id = ?", [id], function(err) {
      if (err) {
        console.error("❌ Erro no DELETE:", err)
        return res.status(500).json({ error: "Erro ao deletar" })
      }
      if (this.changes === 0) return res.status(404).json({ error: "Não encontrado" })
      console.log(`🗑️ Empreendedor ${id} deletado.`)
      res.json({ message: "Deletado com sucesso" })
    })
  })
})

// ====================== TABELA DE USUÁRIOS (LOGIN / SENHAS) ======================
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        reset_token TEXT,
        reset_expires DATETIME
      )
    `, (err) => {
      if (err) console.error("Erro ao criar tabela de usuários:", err.message)
      else console.log("Tabela 'usuarios' pronta.")
    })

    const crypto = require("crypto")

// ====================== RECUPERAÇÃO DE SENHA ======================
app.post("/api/recover-password", (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email é obrigatório." })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 10) // expira em 10 minutos

  db.run(
    "UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE email = ?",
    [token, expires.toISOString(), email],
    function (err) {
      if (err) return res.status(500).json({ error: "Erro ao gerar token." })

      if (this.changes === 0)
        return res.status(404).json({ error: "Email não encontrado." })

      // AQUI você enviaria o email de verdade usando Nodemailer
      console.log(`📩 Token de recuperação para ${email}: ${token}`)

      res.json({
        message: "Token gerado. (Em produção: enviado por email)",
        token, // apenas para DEV
      })
    }
  )
})

app.post("/api/update-password", (req, res) => {
  const { token, novaSenha } = req.body

  if (!token || !novaSenha)
    return res.status(400).json({ error: "Token e nova senha são obrigatórios." })

  db.get(
    "SELECT id, reset_expires FROM usuarios WHERE reset_token = ?",
    [token],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Erro no banco" })
      if (!user) return res.status(404).json({ error: "Token inválido" })

      // Verifica expiração
      if (new Date(user.reset_expires) < new Date()) {
        return res.status(400).json({ error: "Token expirado" })
      }

      // Atualiza senha e limpa token
      db.run(
        "UPDATE usuarios SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
        [novaSenha, user.id],
        function (err) {
          if (err) return res.status(500).json({ error: "Erro ao atualizar senha." })

          res.json({ message: "Senha atualizada com sucesso!" })
        }
      )
    }
  )
})


// ====================== INICIAR SERVIDOR ======================
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`)
  console.log(`📁 Uploads servidos em: http://localhost:${PORT}/uploads`)
  console.log(`💾 Banco em: ${dbPath}`)
  console.log(`🖥️  Front-end servido de: ${frontendDir}`)
})

// Graceful shutdown (opcional, para dev)
process.on('SIGINT', () => {
  console.log("\n🛑 Encerrando servidor...")
  db.close((err) => {
    if (err) console.error("Erro ao fechar BD:", err)
    server.close(() => process.exit(0))
  })
})

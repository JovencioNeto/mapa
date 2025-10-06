// ====================== IMPORTS ======================
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// ====================== CONFIGURAÇÕES ======================
const app = express();
const PORT = 3000;

// Pasta de uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Serve o front-end junto (HTML, CSS, JS)
const frontendDir = path.join(__dirname, "../frontend"); // ajuste se sua pasta for diferente
app.use(express.static(frontendDir));

// ====================== MIDDLEWARES ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// ====================== BANCO DE DADOS ======================
const db = new sqlite3.Database(path.join(__dirname, "banco.db"), (err) => {
  if (err) console.error("❌ Erro ao conectar ao banco:", err.message);
  else console.log("💾 Banco de dados conectado com sucesso.");

  // Cria tabela se não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS empreendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT,
      endereco TEXT,
      lat REAL,
      lng REAL,
      horaInicio TEXT,
      horaFim TEXT,
      diasFuncionamento TEXT,
      telefone TEXT,
      whatsapp TEXT,
      email TEXT,
      instagram TEXT,
      lojaVirtual TEXT,
      imagem TEXT
    )
  `, (err) => {
    if (err) console.error("❌ Erro ao criar tabela:", err.message);
    else console.log("💾 Tabela 'empreendedores' criada ou já existia");

    // Adiciona coluna tipoLoja se não existir
    db.run(`ALTER TABLE empreendedores ADD COLUMN tipoLoja TEXT`, (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("❌ Erro ao adicionar coluna tipoLoja:", err.message);
      } else {
        console.log("✅ Coluna tipoLoja verificada/criada com sucesso.");
      }
    });
  });
});

// ====================== UPLOAD (MULTER) ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Formato de imagem inválido."));
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// ====================== ROTAS ======================
// Listar todos os empreendedores
app.get("/api/empreendedores", (req, res) => {
  db.all("SELECT * FROM empreendedores", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar dados" });
    res.json(rows);
  });
});

// Buscar empreendedor por ID
app.get("/api/empreendedores/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM empreendedores WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar registro" });
    if (!row) return res.status(404).json({ error: "Negócio não encontrado" });
    res.json(row);
  });
});

// Cadastrar novo empreendedor
app.post("/api/empreendedores", upload.single("imagem"), (req, res) => {
  try {
    const {
      nome, descricao, categoria, endereco, lat, lng,
      horaInicio, horaFim, diasFuncionamento, tipoLoja,
      telefone, whatsapp, email, instagram, lojaVirtual
    } = req.body;

    if (!nome) return res.status(400).json({ error: "O campo 'nome' é obrigatório." });
    if (!lat || !lng) return res.status(400).json({ error: "As coordenadas são obrigatórias." });
    if (!horaInicio || !horaFim) return res.status(400).json({ error: "Informe o horário de funcionamento." });

    const diasFuncionamentoFmt = diasFuncionamento ? JSON.parse(diasFuncionamento).join(", ") : "";
    const tipoLojaFmt = tipoLoja ? JSON.parse(tipoLoja).join(", ") : "";
    const imagem = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO empreendedores (
        nome, descricao, categoria, endereco, lat, lng,
        horaInicio, horaFim, diasFuncionamento, tipoLoja,
        telefone, whatsapp, email, instagram, lojaVirtual, imagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nome, descricao, categoria, endereco, lat, lng,
      horaInicio, horaFim, diasFuncionamentoFmt, tipoLojaFmt,
      telefone, whatsapp, email, instagram, lojaVirtual, imagem
    ];

    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: "Erro ao salvar no banco de dados" });
      res.status(201).json({ id: this.lastID, message: "Cadastro realizado com sucesso!" });
    });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// ====================== INICIAR SERVIDOR ======================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});

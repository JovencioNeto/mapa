import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Upload de imagens =====
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas arquivos de imagem são permitidos!"));
    }
    cb(null, true);
  },
});

// Servir arquivos de imagem
app.use("/uploads", express.static(uploadDir));

// ===== Banco de dados =====
let db;
async function initDB() {
  db = await open({
    filename: "./banco.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS empreendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      imagem TEXT,
      descricao TEXT,
      lat REAL,
      lng REAL,
      endereco TEXT,
      email TEXT,
      telefone TEXT,
      whatsapp TEXT,
      instagram TEXT,
      diasFuncionamento TEXT,
      horaInicio TEXT,
      horaFim TEXT,
      lojaVirtualLink TEXT
    )
  `);
}

// ===== Rotas =====

// Cadastrar empreendedor
app.post("/api/empreendedores", upload.single("imagem"), async (req, res) => {
  try {
    const {
      nome,
      categoria,
      descricao,
      lat,
      lng,
      endereco,
      email,
      telefone,
      whatsapp,
      instagram,
      diasFuncionamento,
      horaInicio,
      horaFim,
      linkLojaVirtual
    } = req.body;

    // Campos obrigatórios
    if (!nome || !categoria || !descricao || !lat || !lng || !email || !telefone) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Converter lat/lng para números
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Latitude ou longitude inválida" });
    }

    // Caminho da imagem
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;

    // Inserir no banco
    await db.run(
      `INSERT INTO empreendedores 
       (nome, categoria, imagem, descricao, lat, lng, endereco, email, telefone, whatsapp, instagram, diasFuncionamento, horaInicio, horaFim, lojaVirtualLink)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, categoria, imagem, descricao, latitude, longitude, endereco,
        email, telefone, whatsapp, instagram, diasFuncionamento,
        horaInicio, horaFim, linkLojaVirtual || null
      ]
    );

    res.json({ message: "Empreendedor cadastrado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar empreendedor." });
  }
});

// Listar todos os empreendedores
app.get("/api/empreendedores", async (req, res) => {
  try {
    const empreendedores = await db.all(`SELECT * FROM empreendedores`);
    res.json(empreendedores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar empreendedores." });
  }
});

// Listar todas as tabelas e seus dados
app.get("/api/todas-tabelas", async (req, res) => {
  try {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const result = {};
    for (const t of tables) {
      result[t.name] = await db.all(`SELECT * FROM ${t.name}`);
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar tabelas" });
  }
});

// ===== Inicialização do servidor =====
async function start() {
  await initDB();
  app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));

  const rows = await db.all("SELECT * FROM empreendedores")
  console.log(rows)
}

start();

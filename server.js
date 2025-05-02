import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();
const app = express();

// ✅ Configuração segura e funcional de CORS
const corsOptions = {
  origin: ['https://danieldavidps94.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};

app.use(cors(corsOptions));

// ✅ Aumenta o limite do body para 200MB
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Middleware para debug
app.use((req, res, next) => {
  console.log(`Recebida requisição: ${req.method} ${req.path}`);
  next();
});

app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date() });
});

// ✅ Endpoint principal de envio
app.post('/api/enviar', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const dados = req.body;

  if (!dados.responsavel_demanda || !dados.email_demanda || !dados.nome_ponto_focal) {
    return res.status(400).json({
      error: "Campos obrigatórios faltando",
      requiredFields: {
        responsavel_demanda: "Nome completo do responsável",
        email_demanda: "E-mail válido do responsável",
        nome_ponto_focal: "Nome completo do ponto focal"
      }
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(dados.email_demanda)) {
    return res.status(400).json({ error: "Formato de e-mail inválido" });
  }

  try {
    // ✅ Usa o PDF visual gerado no frontend
    const pdfBytes = Buffer.from(dados.pdf_base64, 'base64');
    const filename = `formularios/formulario-${Date.now()}-${dados.responsavel_demanda.replace(/\s+/g, '-')}.pdf`;

    const octokit = new Octokit({ auth: token });
    await octokit.repos.createOrUpdateFileContents({
      owner: "danieldavidps94",
      repo: "formularios-firjan",
      path: filename,
      message: `Novo formulário: ${dados.responsavel_demanda}`,
      content: pdfBytes.toString('base64'),
    });

    res.status(200).json({
      success: true,
      filename: filename,
      download_url: `https://github.com/danieldavidps94/formularios-firjan/blob/main/${filename}`
    });

  } catch (error) {
    console.error("Erro detalhado:", error);
    res.status(500).json({
      error: "Erro ao processar o formulário",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: "Erro interno no servidor",
    requestId: req.id
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});

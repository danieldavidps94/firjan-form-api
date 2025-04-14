import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

dotenv.config();
const app = express();

app.use(cors({ origin: 'https://danieldavidps94.github.io' }));
app.use(express.json());

// Endpoint de saúde para o UptimeRobot
app.get('/ping', (req, res) => {
  res.status(200).send('🟢 API online e saudável!');
});

app.post('/api/enviar', async (req, res) => {
  const { dados, pdfBase64 } = req.body; // Agora recebe ambos

  if (!dados.responsavel_demanda || !dados.email_demanda) {
    return res.status(400).send("Nome e e-mail do responsável são obrigatórios.");
  }

  try {
    // Opção 1: Usar o PDF gerado no front-end (mais fiel)
    const filename = `formularios/formulario-${Date.now()}.pdf`;
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    await octokit.repos.createOrUpdateFileContents({
      owner: "danieldavidps94",
      repo: "formularios-firjan",
      path: filename,
      message: "Novo formulário completo enviado",
      content: pdfBase64, // Usa o PDF gerado pelo html2canvas
    });

    // Opção 2: Mantém o pdf-lib para versão textual (opcional)
    const pdfDoc = await PDFDocument.create();
    // ... (código existente do pdf-lib) ...
    // Pode salvar como um arquivo adicional se necessário

    res.status(200).send("PDF salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar PDF:", error);
    res.status(500).send("Erro ao salvar PDF.");
  }
});
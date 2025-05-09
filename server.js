import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import PdfPrinter from 'pdfmake';
import { pdfFonts } from 'pdfmake/build/vfs_fonts';  // Corrigido para importar de forma correta

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://danieldavidps94.github.io');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = process.env.PORT || 10000;
const GITHUB_OWNER = 'danieldavidps94';
const GITHUB_REPO = 'formularios-firjan';
const APP_USER = process.env.APP_USER || 'admin';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Credenciais não fornecidas' });
  }
  if (username === APP_USER && password === APP_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false });
});

app.post('/enviar', async (req, res) => {
  const formData = req.body;

  try {
    // Criar PDF com pdfmake
    const fonts = {
      Arial: {
        normal: 'Arial',
        bold: 'Arial',
        italics: 'Arial',
        bolditalics: 'Arial',
      }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
      content: [
        { text: 'Formulário - Firjan SENAI', style: 'header' },
        '\n',
        ...Object.entries(formData).map(([key, value]) => ({
          text: `${formatarCampo(key)}: ${Array.isArray(value) ? value.join(', ') : value}`,
          margin: [0, 2],
        }))
      ],
      styles: {
        header: { fontSize: 16, bold: true, alignment: 'center' }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = `formulario-${Date.now()}.pdf`;

      // Enviar PDF para GitHub
      try {
        await axios.put(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}`,
          {
            message: `Novo formulário: ${filename}`,
            content: pdfBuffer.toString('base64'),
          },
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
            },
          }
        );
        res.status(200).json({ success: true, message: 'Formulário enviado com sucesso.' });
      } catch (githubError) {
        console.error('Erro ao enviar PDF para o GitHub:', githubError);
        res.status(500).json({ success: false, message: 'Erro ao enviar PDF para o GitHub.' });
      }
    });

    pdfDoc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar formulário.' });
  }
});

// Utilitário opcional para melhorar legibilidade dos nomes de campo
function formatarCampo(campo) {
  return campo
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

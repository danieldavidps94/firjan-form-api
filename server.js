import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = process.env.PORT || 10000;
const GITHUB_OWNER = 'danieldavidps94';
const GITHUB_REPO = 'formularios-firjan';

app.post('/enviar', async (req, res) => {
  const formData = req.body;

  try {
    // 1. Criar PDF otimizado
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750; // Posição inicial Y
    const margin = 50;
    const fontSize = 10;
    const lineHeight = 14;

    // Título
    page.drawText('Formulário de Levantamento de Necessidades', {
      x: margin,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Conteúdo
    for (const [campo, valor] of Object.entries(formData)) {
      if (Array.isArray(valor)) {
        page.drawText(`${campo}: ${valor.join(', ')}`, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(`${campo}: ${valor}`, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;

      // Nova página se necessário
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 750;
      }
    }

    const pdfBytes = await pdfDoc.save();

    // 2. Enviar para o GitHub
    const filename = `formulario-${Date.now()}.pdf`;
    await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}`,
      {
        message: `Novo formulário: ${filename}`,
        content: Buffer.from(pdfBytes).toString('base64'),
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    res.status(200).json({ success: true, message: 'Formulário enviado com sucesso.' });
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ success: false, message: 'Erro ao enviar formulário.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
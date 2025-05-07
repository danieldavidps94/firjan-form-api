import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Dados fixos do repositório
const GITHUB_OWNER = 'danieldavidps94';
const GITHUB_REPO = 'formularios-firjan';

app.post('/enviar', async (req, res) => {
  const formData = req.body;

  try {
    // 1. Criar PDF simples
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 12;
    const margin = 50;
    let y = height - margin;

    for (const [campo, valor] of Object.entries(formData)) {
      page.drawText(`${campo}: ${valor}`, {
        x: margin,
        y: y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 8;
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    // 2. Enviar para o GitHub
    const filename = `formulario-${Date.now()}.pdf`;

    await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}`,
      {
        message: `Novo envio de formulário: ${filename}`,
        content: pdfBase64,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    res.status(200).json({ success: true, message: 'Formulário enviado e PDF salvo com sucesso.' });
  } catch (error) {
    console.error('Erro ao processar:', error.message);
    res.status(500).json({ success: false, message: 'Erro ao gerar ou enviar o PDF.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

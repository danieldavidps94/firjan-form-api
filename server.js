import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import PdfPrinter from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts.js'; // Importação CommonJS como default

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

const printer = new PdfPrinter(fonts);
printer.vfs = pdfFonts.pdfMake.vfs; // ✅ Acesso à propriedade correta

app.post('/enviar', async (req, res) => {
  const formData = req.body;

  const docDefinition = {
    content: [
      { text: 'Formulário - Firjan SENAI', style: 'header' },
      '\n',
      ...Object.entries(formData).map(([key, value]) => ({
        text: `${key}: ${Array.isArray(value) ? value.join(', ') : value}`,
        margin: [0, 2]
      }))
    ],
    styles: {
      header: { fontSize: 16, bold: true, alignment: 'center' }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];

  pdfDoc.on('data', (chunk) => chunks.push(chunk));
  pdfDoc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  });

  pdfDoc.end();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

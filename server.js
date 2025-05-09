import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import PdfPrinter from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts.js'; // Importa corretamente com .js

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 10000;

// Usa a fonte Roboto (única disponível por padrão no pdfmake)
const fonts = {
  Roboto: {
    normal: 'Roboto-Regular',
    bold: 'Roboto-Medium',
    italics: 'Roboto-Italic',
    bolditalics: 'Roboto-MediumItalic',
  },
};

const printer = new PdfPrinter(fonts);

// ✅ CORRETO: acessa vfs diretamente
printer.vfs = pdfFonts.vfs;

app.post('/enviar', async (req, res) => {
  const formData = req.body;

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

  pdfDoc.on('data', chunk => chunks.push(chunk));
  pdfDoc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  });

  pdfDoc.end();
});

function formatarCampo(campo) {
  return campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

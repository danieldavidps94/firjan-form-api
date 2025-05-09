import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 10000;

// Aponta para fontes embutidas no build
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
    },
    defaultStyle: {
      font: 'Roboto' // Fonte padrão já incluída no build
    }
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);

  pdfDocGenerator.getBuffer((buffer) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  });
});

function formatarCampo(campo) {
  return campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

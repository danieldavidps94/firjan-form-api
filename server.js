import express from 'express';
import { jsPDF } from 'jspdf';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/enviar', async (req, res) => {
  const formData = req.body;

  try {
    // Criar um novo documento PDF
    const doc = new jsPDF();
    doc.setFontSize(16);

    // Adicionar título
    doc.text('Formulário - Firjan SENAI', 10, 20);

    // Adicionar os dados do formulário
    let yPosition = 30;
    Object.entries(formData).forEach(([key, value]) => {
      doc.text(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`, 10, yPosition);
      yPosition += 10;
    });

    // Gerar o PDF e enviar como resposta
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    res.status(500).send({ error: 'Erro ao gerar PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

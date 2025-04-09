
import express from 'express';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { PDFDocument, rgb } from 'pdf-lib';

dotenv.config();
const app = express();
app.use(express.json());

app.post('/api/enviar', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  const { nome, email, mensagem } = req.body;

  if (!nome || !email || !mensagem) {
    return res.status(400).send("Campos obrigatórios faltando.");
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { height } = page.getSize();
    const fontSize = 14;

    page.drawText("Levantamento de Necessidades - Firjan", { x: 50, y: height - 50, size: fontSize + 2, color: rgb(0, 0, 0.8) });
    page.drawText(`Nome: ${nome}`, { x: 50, y: height - 90, size: fontSize });
    page.drawText(`Email: ${email}`, { x: 50, y: height - 120, size: fontSize });
    page.drawText("Mensagem:", { x: 50, y: height - 150, size: fontSize });
    page.drawText(mensagem, { x: 50, y: height - 180, size: fontSize, maxWidth: 500 });

    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");
    const filename = `formularios/formulario-${Date.now()}.pdf`;

    await octokit.repos.createOrUpdateFileContents({
      owner: "danieldavidps94",
      repo: "formularios-firjan",
      path: filename,
      message: "Novo formulário via Render",
      content: base64PDF
    });

    res.status(200).send("PDF salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao processar:", error);
    res.status(500).send("Erro ao salvar PDF.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

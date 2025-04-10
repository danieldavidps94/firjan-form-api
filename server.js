import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

dotenv.config();
const app = express();

app.use(cors({ origin: 'https://danieldavidps94.github.io' }));
app.use(express.json());

app.post('/api/enviar', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const dados = req.body;

  console.log("📩 Dados recebidos:", dados);

  if (!dados.responsavel_nome || !dados.responsavel_email) {
    console.warn("❌ Nome ou email do responsável ausente");
    return res.status(400).send("Nome e e-mail do responsável são obrigatórios.");
  }

  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();
    const fontSize = 11;
    const margin = 40;

    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    let y = height - margin;

    page.drawText("Formulário - Levantamento de Necessidades", {
      x: margin,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0.8),
    });

    y -= 30;

    for (const [campo, valor] of Object.entries(dados)) {
      if (typeof valor !== "string") continue;

      if (y < 50) {
        page = pdfDoc.addPage([600, 800]);
        y = height - margin;
      }

      page.drawText(`${campo.replace(/_/g, " ")}: ${valor}`, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");
    const filename = `formularios/formulario-${Date.now()}.pdf`;

    const octokit = new Octokit({ auth: token });

    console.log("📤 Enviando PDF para GitHub:", filename);

    await octokit.repos.createOrUpdateFileContents({
      owner: "danieldavidps94",
      repo: "formularios-firjan",
      path: filename,
      message: "Novo formulário completo enviado",
      content: base64PDF,
    });

    console.log("✅ PDF salvo com sucesso!");
    res.status(200).send("PDF salvo com sucesso!");
  } catch (error) {
    console.error("🔥 Erro ao salvar PDF:", error);
    res.status(500).send("Erro ao salvar PDF.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

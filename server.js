import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { PDFDocument, rgb } from 'pdf-lib';

dotenv.config();
const app = express();

// 🛡️ ATIVA O CORS AQUI
app.use(cors({
  origin: 'https://danieldavidps94.github.io' // libera seu front-end do GitHub Pages
}));

app.use(express.json());

app.post("/api/enviar", async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });
  const dados = req.body;

  if (!dados.responsavel_demanda || !dados.email_responsavel) {
    return res.status(400).send("Campos obrigatórios ausentes.");
  }

  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 40;

    page.drawText("Levantamento de Necessidades - Firjan SENAI", {
      x: 40,
      y,
      size: 16,
      font,
      color: rgb(0, 0.2, 0.6),
    });

    y -= 30;

    for (const [chave, valor] of Object.entries(dados)) {
      const texto = `${chave.replace(/_/g, " ")}: ${valor}`;
      const linhas = font.splitTextIntoLines(texto, 90);
      for (const linha of linhas) {
        if (y < 50) {
          page = pdfDoc.addPage([600, 800]);
          y = height - 40;
        }
        page.drawText(linha, { x: 40, y, size: 10, font, color: rgb(0, 0, 0) });
        y -= 14;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const base64PDF = Buffer.from(pdfBytes).toString("base64");

    const nomeEmpresa = dados.empresa || "sem-nome";
    const fileName = `levantamento-${nomeEmpresa.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    await octokit.repos.createOrUpdateFileContents({
      owner: "danieldavidps94",
      repo: "formularios-firjan",
      path: `formularios/${fileName}`,
      message: `Formulário enviado: ${nomeEmpresa}`,
      content: base64PDF,
      branch: "main",
    });

    res.status(200).send("PDF enviado com sucesso para o GitHub!");
  } catch (erro) {
    console.error("Erro ao enviar PDF:", erro);
    res.status(500).send("Erro ao gerar ou enviar PDF.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
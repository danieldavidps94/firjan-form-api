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

  // Mapeamento de campos legíveis
  const camposLegiveis = {
    responsavel_demanda: 'Responsável pela Demanda',
    instituicao_demanda: 'Instituição (Demanda)',
    area_demanda: 'Área (Demanda)',
    cargo_demanda: 'Cargo (Demanda)',
    email_demanda: 'Email (Demanda)',
    telefone_demanda: 'Telefone (Demanda)',
    funcao_demanda: 'Função (Demanda)',

    nome_ponto_focal: 'Ponto Focal',
    instituicao_ponto_focal: 'Instituição (Ponto Focal)',
    area_ponto_focal: 'Área (Ponto Focal)',
    cargo_ponto_focal: 'Cargo (Ponto Focal)',
    email_ponto_focal: 'Email (Ponto Focal)',
    telefone_ponto_focal: 'Telefone (Ponto Focal)',
    funcao_ponto_focal: 'Função (Ponto Focal)',

    descricao_demanda: 'Descrição da Demanda',
    publico_atingido: 'Público Atingido',
    objetivos: 'Objetivos da Demanda',
    resultados_esperados: 'Resultados Esperados',
  };

  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750;
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

    // Percorrer todos os campos, mesmo se não enviados
    for (const campo in camposLegiveis) {
      const rotulo = camposLegiveis[campo];
      const valor = formData[campo];

      const texto = Array.isArray(valor)
        ? `${rotulo}: ${valor.join(', ')}`
        : `${rotulo}: ${valor || '—'}`; // mostra traço se estiver vazio

      page.drawText(texto, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      y -= lineHeight;

      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 750;
      }
    }

    const pdfBytes = await pdfDoc.save();

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

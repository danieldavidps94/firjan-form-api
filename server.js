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

  // Campos com nomes legíveis personalizados
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
    const maxWidth = 495;

    // Função para gerar rótulo amigável
    const gerarRotulo = (chave) => {
      if (camposLegiveis[chave]) return camposLegiveis[chave];
      return chave
        .replace(/_/g, ' ')               // snake_case -> espaço
        .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> espaço
        .replace(/\b\w/g, l => l.toUpperCase()); // primeira letra maiúscula
    };

    // Função para quebrar texto em linhas
    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let line = '';

      for (const word of words) {
        const testLine = line + word + ' ';
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line.trim());
      return lines;
    };

    // Título
    page.drawText('Formulário de Levantamento de Necessidades', {
      x: margin,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Iterar sobre todos os campos recebidos
    for (const campo of Object.keys(formData)) {
      const rotulo = gerarRotulo(campo);
      const valorBruto = formData[campo];
      const valor = Array.isArray(valorBruto)
        ? valorBruto.join(', ')
        : valorBruto || '—';

      const textoCompleto = `${rotulo}: ${valor}`;
      const linhas = wrapText(textoCompleto, maxWidth);

      for (const linha of linhas) {
        if (y < 50) {
          page = pdfDoc.addPage([595, 842]);
          y = 750;
        }

        page.drawText(linha, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
    }

    // Adicionar data de envio
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR') + ' ' + dataAtual.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const textoData = `Enviado em: ${dataFormatada}`;

    // Se estiver perto do fim da página, cria nova página
    if (y < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = 750;
    }

    y -= lineHeight * 2;
    page.drawText(textoData, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    y -= lineHeight * 2;

    // Assinatura (Nome ou email do responsável)
    const nomeOuEmail = formData['email_demanda'] || 'Assinante desconhecido';  // Nome ou e-mail que veio no formulário
    const textoAssinatura = `Assinado por: ${nomeOuEmail}`;

    if (y < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = 750;
    }

    page.drawText(textoAssinatura, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

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

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Configuração inicial
dotenv.config();
const app = express();

// Verificação de variáveis críticas
if (!process.env.APP_USER || !process.env.APP_PASSWORD) {
  throw new Error('Variáveis de ambiente APP_USER e APP_PASSWORD são obrigatórias!');
}
if (!process.env.GITHUB_TOKEN) {
  throw new Error('Variável de ambiente GITHUB_TOKEN é obrigatória!');
}

// Constantes
const APP_USER = process.env.APP_USER;
const APP_PASSWORD = process.env.APP_PASSWORD;
const PORT = process.env.PORT || 10000;
const GITHUB_OWNER = 'danieldavidps94';
const GITHUB_REPO = 'formularios-firjan';

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['POST', 'GET']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Função auxiliar para novas páginas PDF
const addNewPage = (pdfDoc) => {
  const newPage = pdfDoc.addPage([595, 842]);
  return { page: newPage, y: 750 };
};

// Rota de login melhorada
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validação reforçada
  if (typeof username !== 'string' || 
      typeof password !== 'string' ||
      username.trim() === '' || 
      password.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      message: 'Credenciais inválidas' 
    });
  }

  if (username === APP_USER && password === APP_PASSWORD) {
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false });
});

// Rota de envio de formulário
app.post('/enviar', async (req, res) => {
  try {
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
    abrangencia_projeto: 'Abrangência do Projeto',
    area_atuacao: 'Área de Atuação',
    area_requisitante: 'Área Requisitante',
    assuntos_abordados: 'Assuntos Abordados',
    banco_imagem: 'Banco de Imagens',
    banco_imagem2: 'Necessário Contratar Banco de Imagens',
    campo1: 'A Demanda Relacionada a Objetivo Estratégico?',
    campo1_motivo: 'Motivo (Objetivo Estratégico)',
    campo2: 'A Demanda Relacionada a Outro Projeto?',
    campo2_motivo: 'Motivo (Outro Projeto)',
    campo3: 'A Demanda é Pré-requisito para Outro Projeto?',
    campo3_motivo: 'Motivo (Pré-requisito)',
    campo4: 'Modalidade de Ensino',
    campo5: 'Soluções Hospedadas em LMS?',
    campo5_motivo: 'Motivo (LMS)',
    campo6: 'Estratégia Educacional',
    campo6_outro: 'Outro (Estratégia Educacional)',
    campo7: 'Já Foi Realizada Alguma Ação Relativa à Demanda?',
    campo7_motivo: 'Motivo (Ação Realizada)',
    campo8: 'Expectativa de Prazo para Desenvolvimento?',
    campo8_motivo: 'Motivo (Prazo)',
    campo9: 'Carga Horária Prevista?',
    campo9_motivo: 'Motivo (Carga Horária)',
    campo10: 'Existem Pré-requisitos para Participação?',
    campo10_motivo: 'Motivo (Pré-requisitos)',
    campo11: 'Estilo dos Personagens',
    campo11_outro: 'Outro (Estilo dos Personagens)',
    campo12: 'Especialistas Designados para o Projeto?',
    campo12_motivo: 'Motivo (Especialistas)',
    campo13: 'Previsão de Atualização de Conteúdo?',
    campo13_motivo: 'Motivo (Atualização de Conteúdo)',
    cargo_demanda: 'Cargo (Demanda)',
    cargo_ponto_focal: 'Cargo (Ponto Focal)',
    conhecimento_teorico_pratico: 'Relação entre Conhecimento Teórico e Prático',
    conteudos_existentes: 'Conteúdos Existentes',
    contexto_atual: 'Contexto Atual da Demanda',
    contexto_desejado: 'Contexto Desejado Após Projeto',
    design_responsivo: 'Design Responsivo Necessário?',
    email_demanda: 'Email (Demanda)',
    email_ponto_focal: 'Email (Ponto Focal)',
    faixa_etaria: 'Faixa Etária',
    funcao_demanda: 'Função (Demanda)',
    funcao_exercida: 'Função(s) Exercida(s)',
    gerador_demanda: 'Gerador da Demanda',
    identidade_sonora: 'Manual de Identidade Sonora?',
    identidade_verbal: 'Manual de Identidade Verbal?',
    identidade_visual: 'Manual de Identidade Visual?',
    identidade_visual_extra: 'Identidade Visual Extra',
    info_personagem1: 'Informações sobre Personagem 1',
    infos_adicionais: 'Informações Adicionais',
    instituicao_demanda: 'Instituição (Demanda)',
    instituicao_ponto_focal: 'Instituição (Ponto Focal)',
    legenda_auditivo: 'Legenda Auditiva',
    legenda_visual: 'Legenda Visual',
    manual_marca: 'Manual da Marca?',
    nivel_conhecimento: 'Nível de Conhecimento do Público',
    nivel_instrucao: 'Nível de Instrução',
    nome_ponto_focal: 'Nome (Ponto Focal)',
    objetivos_aprendizagem: 'Objetivos de Aprendizagem',
    quantidade_paginas: 'Quantidade de Páginas/Laudas',
    quantidade_participantes: 'Quantidade de Participantes',
    relacao_publico: 'Relação do Público com a Temática',
    responsavel_demanda: 'Responsável pela Demanda',
    restricoes: 'Restrições',
    resultados_esperados: 'Resultados Esperados após Projeto',
    resumo_demanda: 'Resumo da Demanda',
    telefone_demanda: 'Telefone (Demanda)',
    telefone_ponto_focal: 'Telefone (Ponto Focal)',
    tipo_solucao: 'Tipo de Solução',
    visualizacao_off: 'Visualização Offline Necessária?',
  };

  try {
    const pdfDoc = await PDFDocument.create();
    let { page, y } = addNewPage(pdfDoc);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Constantes de formatação
    const margin = 50;
    const fontSize = 10;
    const lineHeight = 14;
    const maxWidth = 495;

    // Função para quebrar texto em linhas
    const wrapText = (text) => {
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
      lines.push(line.trim());
      return lines;
    };

    // Cabeçalho
    page.drawText('Formulário de Levantamento de Necessidades', {
      x: margin,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Conteúdo dinâmico
    for (const campo of Object.keys(formData)) {
      const rotulo = camposLegiveis[campo] || campo
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase());

      const valor = Array.isArray(formData[campo]) 
        ? formData[campo].join(', ') 
        : formData[campo] || '—';

      const linhas = wrapText(`${rotulo}: ${valor}`);

      for (const linha of linhas) {
        if (y < 50) ({ page, y } = addNewPage(pdfDoc));
        
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

    // Rodapé melhorado
    const footerContent = [
      `Enviado em: ${new Date().toLocaleString('pt-BR')}`,
      `Assinado por: ${formData.email_demanda || 'Não informado'}`
    ];

    for (const texto of footerContent) {
      if (y < 50) ({ page, y } = addNewPage(pdfDoc));
      
      page.drawText(texto, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 2;
    }

    // Upload para GitHub
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
    console.error('Erro detalhado:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno no processamento do formulário' 
    });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});
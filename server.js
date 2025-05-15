import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

dotenv.config();

const APP_USER = process.env.APP_USER || 'admin';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';
const PORT = process.env.PORT || 10000;
const GITHUB_OWNER = 'danieldavidps94';
const GITHUB_REPO = 'formularios-firjan';

const app = express();

// 🚨 CORS liberado para seu GitHub Pages
app.use(cors({
    origin: 'https://danieldavidps94.github.io',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Credenciais não fornecidas' });
    }

    if (username === APP_USER && password === APP_PASSWORD) {
        return res.json({ success: true });
    }

    return res.status(401).json({ success: false });
});

// Rota de envio do formulário (mantém seu código completo)
app.post('/enviar', async (req, res) => {
    const formData = req.body;

    const camposLegiveis = { 
        // (mantém todo o seu dicionário como está, sem alteração)
        // 👇️ só coloque aqui o mesmo bloco completo que você já tem
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
        conhecimento_teorico_pratico: 'Relação entre Conhecimento Teórico e Prático',
        conteudos_existentes: 'Conteúdos Existentes',
        contexto_atual: 'Contexto Atual da Demanda',
        contexto_desejado: 'Contexto Desejado Após Projeto',
        design_responsivo: 'Design Responsivo Necessário?',
        faixa_etaria: 'Faixa Etária',
        funcao_exercida: 'Função(s) Exercida(s)',
        gerador_demanda: 'Gerador da Demanda',
        identidade_sonora: 'Manual de Identidade Sonora?',
        identidade_verbal: 'Manual de Identidade Verbal?',
        identidade_visual: 'Manual de Identidade Visual?',
        identidade_visual_extra: 'Identidade Visual Extra',
        info_personagem1: 'Informações sobre Personagem 1',
        infos_adicionais: 'Informações Adicionais',
        legenda_auditivo: 'Legenda Auditiva',
        legenda_visual: 'Legenda Visual',
        manual_marca: 'Manual da Marca?',
        nivel_conhecimento: 'Nível de Conhecimento do Público',
        nivel_instrucao: 'Nível de Instrução',
        objetivos_aprendizagem: 'Objetivos de Aprendizagem',
        quantidade_paginas: 'Quantidade de Páginas/Laudas',
        quantidade_participantes: 'Quantidade de Participantes',
        relacao_publico: 'Relação do Público com a Temática',
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
        let page = pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let y = 750;
        const margin = 50;
        const fontSize = 10;
        const lineHeight = 14;
        const maxWidth = 495;

        const gerarRotulo = chave =>
            camposLegiveis[chave] || chave.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());

        const wrapText = (text, maxWidth) => {
            const words = text.split(' ');
            const lines = [];
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line !== '') {
                    lines.push(line.trim());
                    line = word + ' ';
                } else line = testLine;
            }
            if (line) lines.push(line.trim());
            return lines;
        };

        page.drawText('Formulário de Levantamento de Necessidades', { x: margin, y, size: 14, font, color: rgb(0, 0, 0) });
        y -= lineHeight * 2;

        for (const campo of Object.keys(formData)) {
            const rotulo = gerarRotulo(campo);
            const valor = Array.isArray(formData[campo]) ? formData[campo].join(', ') : formData[campo] || '—';
            for (const linha of wrapText(`${rotulo}: ${valor}`, maxWidth)) {
                if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 750; }
                page.drawText(linha, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
                y -= lineHeight;
            }
        }

        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR') + ' ' + dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 750; }
        y -= lineHeight * 2;
        page.drawText(`Enviado em: ${dataFormatada}`, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });

        const nomeOuEmail = formData['email_demanda'] || 'Assinante desconhecido';
        if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 750; }
        page.drawText(`Assinado por: ${nomeOuEmail}`, { x: margin, y: y - lineHeight * 2, size: fontSize, font, color: rgb(0, 0, 0) });

        const filename = `formulario-${Date.now()}.pdf`;
        await axios.put(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}`, {
            message: `Novo formulário: ${filename}`,
            content: Buffer.from(await pdfDoc.save()).toString('base64'),
        }, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
            }
        });

        res.status(200).json({ success: true, message: 'Formulário enviado com sucesso.' });
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao enviar formulário.' });
    }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

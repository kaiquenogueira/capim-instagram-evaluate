'use server';

import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { AnalysisResult } from '@/types';
import { getRankingContext, getRankingStats, saveProfile } from '@/lib/db';

async function fetchImageAsBase64(url: string): Promise<{ data: string, mimeType: string } | null> {
  try {
    console.log(`Baixando imagem: ${url.substring(0, 50)}...`);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 5000, // 5s timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/'
      }
    });
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    console.log(`Imagem baixada com sucesso (${response.data.length} bytes, type: ${mimeType})`);
    return {
      data: Buffer.from(response.data).toString('base64'),
      mimeType
    };
  } catch (e) {
    console.error(`Erro ao baixar imagem (${url.substring(0, 50)}...):`, axios.isAxiosError(e) ? e.message : e);
    return null;
  }
}

export async function analyzeProfile(handle: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const scrapeKey = process.env.space_creators_api_key;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Coleta de dados via ScrapeCreators API
  let contextData = '';
  let profileStats = undefined;
  let profilePictureUrl = undefined;
  let last3Posts: any[] = [];
  let rankingContext = '';

  try {
    const response = await axios.get(`https://api.scrapecreators.com/v1/instagram/profile?handle=${handle}`, {
      headers: { "x-api-key": scrapeKey }
    });
    
    const root = response.data;
    const user = root.data?.user;

    console.log('Dados do scraper:', JSON.stringify(user, null, 2));
    
    if (user) {
      contextData = JSON.stringify(user);
      profilePictureUrl = user.profile_pic_url_hd || user.profile_pic_url;
      profileStats = {
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        posts: user.edge_owner_to_timeline_media?.count || 0
      };

      // Get ranking context
      rankingContext = await getRankingContext(profileStats.followers, profileStats.posts);

      // Extract last 3 posts
      if (user.edge_owner_to_timeline_media?.edges) {
        last3Posts = user.edge_owner_to_timeline_media.edges.slice(0, 3).map((edge: any) => ({
          url: edge.node.display_url,
          caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text || '',
          likes: edge.node.edge_liked_by?.count || 0,
          comments: edge.node.edge_media_to_comment?.count || 0,
          type: edge.node.__typename
        }));
      }
    }
  } catch (error) {
    console.error('Falha ao acessar ScrapeCreators API:', error);
    if (axios.isAxiosError(error)) {
       console.error('Detalhes do erro:', error.response?.data);
    }
  }

  // --- AGENT 1: Análise do Perfil e Bio ---
  const profilePrompt = `
    Analise o perfil do Instagram @${handle} com base nos dados brutos coletados via API abaixo.
    
    DADOS COLETADOS (JSON):
    ${contextData ? contextData : 'Não foi possível coletar dados via API. Use seu conhecimento (Google Search) para encontrar informações recentes.'}

    ${rankingContext ? `CONTEXTO DE MERCADO (BASE LOCAL):\n${rankingContext}\nUse estes dados para contextualizar o posicionamento do perfil nas sugestões (ex: "Você está acima da média em seguidores, mas...").` : ''}

    Realize uma análise criteriosa focada em clínicas odontológicas e dentistas (ou nicho aparente).
    
    INSTRUÇÕES ESPECÍFICAS PARA BIO/DESCRIÇÃO:
    - Analise a clareza da promessa (o que faz, para quem).
    - Verifique elementos de CRO do Dentista, Call to Action e link na bio.
    - Avalie o tom de voz (profissional, amigável, autoritário, etc).

    Gere um relatório JSON estrito com a seguinte estrutura (sem markdown, apenas JSON):
    {
      "handle": "${handle}",
      "metrics": {
        "quality": (nota 0-100 baseada na qualidade percebida),
        "consistency": (nota 0-100 baseada na frequência de posts),
        "branding": (nota 0-100 baseada na força da marca/identidade na bio e nome),
        "interaction": (nota 0-100 baseada no engajamento provável)
      },
      "detailedMetrics": {
        "overallScore": (nota 0-100: nota geral do perfil),
        "criteria": {
          "frequency": (nota 0-100: frequência e constância de postagem),
          "ctaAndLinks": (nota 0-100: presença de links de whats/agendamento e call to action),
          "positioningClarity": (nota 0-100: clareza de posicionamento),
          "socialProof": (nota 0-100: prova social, depoimentos, etc)
        }
      },
      "bioAnalysis": {
        "clarity": (nota 0-100: quão claro é o que o perfil oferece?),
        "cro": (nota 0-100: quão otimizado para conversão está?),
        "tone": "Descreva o tom em 2-3 palavras (ex: Profissional e Acolhedor)",
        "suggestions": ["Sugestão 1 para melhorar bio", "Sugestão 2"]
      },
      "summary": "Um resumo de 2-3 frases sobre o perfil, destacando pontos fortes e fracos.",
      "tips": ["Dica prática 1", "Dica prática 2", "Dica prática 3", "Dica prática 4"]
    }

    Se o perfil não for encontrado ou for privado, retorne métricas neutras (50), mas SEMPRE retorne o JSON válido.
  `;

  // --- AGENT 2: Análise dos Posts (Multimodal) ---
  // Preparar promessa para análise de posts
  const postsAnalysisPromise = (async () => {
    if (last3Posts.length === 0) return [];

    const postsParts: any[] = [];
    let postsPromptText = "Analise os seguintes 3 posts (Imagem + Legenda) deste perfil. Para cada post, forneça uma análise de melhoria construitiva que possa ajudar no engajamento do perfil no instagram.\n\n";

    // Armazenar imagens em base64 para uso no frontend
    const postsImagesBase64: string[] = [];

    for (let i = 0; i < last3Posts.length; i++) {
      const post = last3Posts[i];
      postsPromptText += `POST ${i + 1}:\nLegenda: "${post.caption}"\nLikes: ${post.likes}, Comentários: ${post.comments}\n\n`;
      
      const imageResult = await fetchImageAsBase64(post.url);
      if (imageResult) {
        postsParts.push({ inlineData: { mimeType: imageResult.mimeType, data: imageResult.data } });
        // Salvar para retorno
        postsImagesBase64[i] = `data:${imageResult.mimeType};base64,${imageResult.data}`;
      } else {
        postsImagesBase64[i] = post.url; // Fallback para URL original se falhar download
      }
    }

    postsPromptText += `
      Retorne APENAS um JSON array com 3 objetos (um para cada post na ordem), seguindo esta estrutura:
      [
        { "analysis": "Análise crítica do post 1 (visual + copy) em 2 frases." },
        { "analysis": "Análise crítica do post 2 (visual + copy) em 2 frases." },
        { "analysis": "Análise crítica do post 3 (visual + copy) em 2 frases." }
      ]
    `;

    postsParts.push({ text: postsPromptText });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: postsParts }],
      });
      
      const text = response.text;
      if (!text) return last3Posts.map(p => ({ ...p, imageUrl: p.url, analysis: "Falha na análise IA." }));
      
      let cleanText = text.replace(/```json|```/g, '').trim();
      const firstBracket = cleanText.indexOf('[');
      const lastBracket = cleanText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }
      
      const analyses = JSON.parse(cleanText);
      
      return last3Posts.map((post, idx) => ({
        imageUrl: postsImagesBase64[idx] || post.url,
        caption: post.caption,
        likes: post.likes,
        comments: post.comments,
        analysis: analyses[idx]?.analysis || "Análise não disponível."
      }));

    } catch (e) {
      console.error("Erro na análise de posts (Gemini):", e);
      // Log more details if available
      if (e instanceof Error) {
        console.error("Stack:", e.stack);
      }
      return last3Posts.map((p, i) => ({ ...p, imageUrl: postsImagesBase64[i] || p.url, analysis: "Erro ao analisar post. Verifique logs." }));
    }
  })();

  try {
    const [profileResponse, postsAnalysis] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: profilePrompt }] }],
        config: { responseMimeType: 'application/json' }
      }),
      postsAnalysisPromise
    ]);

    const text = profileResponse.text; 
    
    if (!text) throw new Error('Sem resposta do Gemini para o perfil');
    
    const cleanText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText) as AnalysisResult;
    
    // Merge data
    data.handle = handle;
    data.profilePictureUrl = profilePictureUrl;
    data.stats = profileStats;
    data.postsAnalysis = postsAnalysis;

    // Validate and fill missing metrics
    if (!data.metrics) {
      data.metrics = {
        quality: 0,
        consistency: 0,
        branding: 0,
        interaction: 0
      };
    }

    if (!data.summary) {
      data.summary = "Resumo indisponível.";
    }

    if (!data.tips || !Array.isArray(data.tips)) {
      data.tips = ["Sem dicas disponíveis no momento."];
    }

    // Save to local DB for future ranking
    if (data.stats && data.detailedMetrics) {
      await saveProfile({
        handle: data.handle,
        followers: data.stats.followers,
        posts: data.stats.posts,
        overallScore: data.detailedMetrics.overallScore,
        criteria: data.detailedMetrics.criteria,
        timestamp: new Date().toISOString()
      }).catch(err => console.error("Failed to save profile to DB:", err));

      // Get ranking stats including the current profile
      const rankingStats = await getRankingStats(
        data.stats.followers, 
        data.stats.posts, 
        data.detailedMetrics.overallScore
      );
      
      if (rankingStats) {
        data.ranking = rankingStats;
      }
    }

    // Garantir fallback para bioAnalysis se a IA alucinar e não mandar
    if (!data.bioAnalysis) {
        data.bioAnalysis = {
            clarity: 50,
            cro: 50,
            tone: "Não identificado",
            suggestions: ["Revise sua bio"]
        };
    } else if (!data.bioAnalysis.suggestions || !Array.isArray(data.bioAnalysis.suggestions)) {
        data.bioAnalysis.suggestions = ["Sem sugestões disponíveis."];
    }

    if (!data.detailedMetrics) {
        data.detailedMetrics = {
            overallScore: 0,
            criteria: {
                frequency: 0,
                ctaAndLinks: 0,
                positioningClarity: 0,
                socialProof: 0,
                resultsProof: 0
            }
        };
    }

    return data;

  } catch (error) {
    console.error('Erro na análise com Gemini:', error);
    // Fallback de erro elegante
    return {
      handle,
      metrics: { quality: 0, consistency: 0, branding: 0, interaction: 0 },
      bioAnalysis: { clarity: 0, cro: 0, tone: "-", suggestions: [] },
      postsAnalysis: [],
      summary: "Não foi possível analisar este perfil no momento. Verifique se o nome está correto ou tente novamente.",
      tips: ["Verifique a ortografia do usuário", "Tente novamente em alguns instantes"]
    };
  }
}

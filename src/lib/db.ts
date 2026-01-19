import fs from 'fs/promises';
import path from 'path';

const FILENAME = 'profiles.json';
const DATA_DIR = path.join(process.cwd(), 'data');
// Na Vercel, apenas /tmp é gravável em tempo de execução
const TMP_DIR = '/tmp'; 

// Detecta se estamos em ambiente que exige escrita em /tmp (Vercel production)
// Nota: NODE_ENV pode ser production localmente também, então idealmente checaríamos uma ENV da Vercel,
// mas usar /tmp como fallback é seguro.
const IS_VERCEL = process.env.VERCEL === '1';

const DB_PATH = IS_VERCEL ? path.join(TMP_DIR, FILENAME) : path.join(DATA_DIR, FILENAME);
const ORIGINAL_DB_PATH = path.join(DATA_DIR, FILENAME);

export interface StoredProfile {
  handle: string;
  followers: number;
  posts: number;
  overallScore: number;
  timestamp: string;
}

async function ensureDbExists() {
  try {
    await fs.access(DB_PATH);
  } catch {
    // Se o arquivo destino não existe
    if (IS_VERCEL) {
      try {
        // Tenta copiar os dados iniciais do projeto para o /tmp
        const initialData = await fs.readFile(ORIGINAL_DB_PATH, 'utf-8').catch(() => '[]');
        await fs.writeFile(DB_PATH, initialData);
        console.log(`Database initialized in ${DB_PATH} from original data`);
      } catch (e) {
        console.warn(`Could not initialize DB in ${DB_PATH}, starting empty`, e);
        await fs.writeFile(DB_PATH, '[]');
      }
    } else {
      // Em desenvolvimento local, cria se não existir
      try {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, '[]');
      } catch (e) {
        console.error('Error creating local DB:', e);
      }
    }
  }
}

export async function getProfiles(): Promise<StoredProfile[]> {
  await ensureDbExists();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading profiles from ${DB_PATH}:`, error);
    // Tenta ler do original como fallback se o temporário falhar
    if (IS_VERCEL) {
        try {
            const backupData = await fs.readFile(ORIGINAL_DB_PATH, 'utf-8');
            return JSON.parse(backupData);
        } catch {
            return [];
        }
    }
    return [];
  }
}

export async function saveProfile(profile: StoredProfile) {
  try {
    const profiles = await getProfiles();
    const existingIndex = profiles.findIndex(p => p.handle === profile.handle);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    await fs.writeFile(DB_PATH, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Failed to save profile (filesystem might be readonly):', error);
  }
}

export async function getRankingStats(followers: number, posts: number, overallScore: number) {
  const profiles = await getProfiles();
  if (profiles.length === 0) {
    return null;
  }

  // Calculate percentiles
  const followerRank = profiles.filter(p => p.followers < followers).length;
  const followerPercentile = Math.round((followerRank / profiles.length) * 100);
  
  const postRank = profiles.filter(p => p.posts < posts).length;
  const postPercentile = Math.round((postRank / profiles.length) * 100);

  const scoreRank = profiles.filter(p => p.overallScore < overallScore).length;
  const overallScorePercentile = Math.round((scoreRank / profiles.length) * 100);
  
  const avgFollowers = Math.round(profiles.reduce((acc, p) => acc + p.followers, 0) / profiles.length);
  const avgPosts = Math.round(profiles.reduce((acc, p) => acc + p.posts, 0) / profiles.length);
  const avgOverallScore = Math.round(profiles.reduce((acc, p) => acc + p.overallScore, 0) / profiles.length);

  return {
    followersPercentile: followerPercentile,
    postsPercentile: postPercentile,
    overallScorePercentile,
    avgFollowers,
    avgPosts,
    avgOverallScore,
    totalProfiles: profiles.length
  };
}

export async function getRankingContext(followers: number, posts: number): Promise<string> {
  const profiles = await getProfiles();
  if (profiles.length === 0) {
    return "Este é o primeiro perfil analisado na base de dados local.";
  }

  // Calculate percentiles
  const followerRank = profiles.filter(p => p.followers < followers).length;
  const followerPercentile = Math.round((followerRank / profiles.length) * 100);
  
  const postRank = profiles.filter(p => p.posts < posts).length;
  const postPercentile = Math.round((postRank / profiles.length) * 100);
  
  const avgFollowers = Math.round(profiles.reduce((acc, p) => acc + p.followers, 0) / profiles.length);
  const avgPosts = Math.round(profiles.reduce((acc, p) => acc + p.posts, 0) / profiles.length);

  return `
    COMPARATIVO DE MERCADO (Baseado em ${profiles.length} clínicas/dentistas analisados):
    - Seguidores: Você tem mais seguidores que ${followerPercentile}% dos perfis analisados (Média da base: ${avgFollowers}).
    - Posts: Você tem mais posts que ${postPercentile}% dos perfis analisados (Média da base: ${avgPosts}).
  `;
}

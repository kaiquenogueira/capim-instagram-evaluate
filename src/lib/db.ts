import fs from 'fs/promises';
import path from 'path';
import { Criteria } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'profiles.json');

export interface StoredProfile {
  handle: string;
  followers: number;
  posts: number;
  overallScore: number;
  criteria?: Criteria;
  timestamp: string;
}

export async function getProfiles(): Promise<StoredProfile[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveProfile(profile: StoredProfile) {
  const profiles = await getProfiles();
  const existingIndex = profiles.findIndex(p => p.handle === profile.handle);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  await fs.writeFile(DB_PATH, JSON.stringify(profiles, null, 2));
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

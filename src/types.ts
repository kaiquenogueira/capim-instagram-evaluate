export type AnalysisResult = {
  handle: string;
  profilePictureUrl?: string;
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
  ranking?: {
    followersPercentile: number;
    postsPercentile: number;
    overallScorePercentile: number;
    avgFollowers: number;
    avgPosts: number;
    avgOverallScore: number;
    totalProfiles: number;
  };
  metrics: {
    quality: number;
    consistency: number;
    branding: number;
    interaction: number;
  };
  detailedMetrics?: {
    overallScore: number;
    criteria: {
      frequency: number;
      ctaAndLinks: number;
      positioningClarity: number;
      socialProof: number;
      resultsProof: number;
    };
  };
  bioAnalysis: {
    clarity: number;
    cro: number;
    tone: string;
    suggestions: string[];
  };
  postsAnalysis: {
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    analysis: string;
  }[];
  summary: string;
  tips: string[];
};

export interface Contestant {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  studioName?: string;
  registrationDate: string;
  performances: Performance[];
}

export interface Performance {
  id: string;
  contestantId: string;
  title: string;
  category: string;
  duration: number; // in minutes
  scheduledTime?: string;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  isAdmin: boolean;
}

export interface Score {
  id: string;
  judgeId: string;
  performanceId: string;
  technicalScore: number; // 1-10
  artisticScore: number; // 1-10
  overallScore: number; // 1-10
  comments: string;
  submittedAt: string;
}

export interface ScoreSheet {
  performanceId: string;
  contestantName: string;
  performanceTitle: string;
  scores: Score[];
  averageScore: number;
  rank?: number;
} 
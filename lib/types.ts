// Phase 1 Types for E-O-D-S-A Competition System

export interface Dancer {
  id: string; // E-O-D-S-A-ID format
  name: string;
  age: number;
  style: string;
  nationalId: string;
  created_at?: string;
}

export interface Contestant {
  id: string;
  eodsaId: string; // Permanent E-O-D-S-A-ID
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  studioName?: string;
  studioInfo?: {
    address: string;
    contactPerson: string;
    registrationNumber?: string;
  };
  dancers: Dancer[]; // For studio: multiple dancers, for private: single dancer
  registrationDate: string;
  eventEntries: EventEntry[];
}

export interface EventEntry {
  id: string;
  contestantId: string;
  eodsaId: string;
  region: 'Gauteng' | 'Free State' | 'Mpumalanga';
  performanceType: 'Solo' | 'Duet' | 'Trio' | 'Group';
  participantIds: string[]; // E-O-D-S-A-IDs of participating dancers
  ageCategory: string;
  calculatedFee: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: 'credit_card' | 'bank_transfer';
  submittedAt: string;
  approved: boolean;
}

export interface Performance {
  id: string;
  eventEntryId: string;
  contestantId: string;
  title: string;
  region: string;
  performanceType: string;
  ageCategory: string;
  participantNames: string[];
  duration: number; // in minutes
  scheduledTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  isAdmin: boolean;
  region?: string;
  specialization?: string[];
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

export interface FeeSchedule {
  ageCategory: string;
  soloFee: number;
  duetFee: number;
  trioFee: number;
  groupFee: number;
}

export interface Ranking {
  id: string;
  performanceId: string;
  region: string;
  ageCategory: string;
  performanceType: string;
  totalScore: number;
  averageScore: number;
  rank: number;
  calculatedAt: string;
}

// Age categories and fee structure
export const AGE_CATEGORIES = [
  'Under 6',
  '6-8 years',
  '9-11 years', 
  '12-14 years',
  '15-17 years',
  '18+ years'
];

export const REGIONS = [
  'Gauteng',
  'Free State', 
  'Mpumalanga'
];

export const PERFORMANCE_TYPES = [
  'Solo',
  'Duet',
  'Trio',
  'Group'
];

export const DANCE_STYLES = [
  'Ballet',
  'Contemporary',
  'Jazz',
  'Hip Hop',
  'Tap',
  'Musical Theatre',
  'Commercial',
  'Lyrical',
  'Acro',
  'Other'
]; 
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

// NEW: Events are competitions created by admin
export interface Event {
  id: string;
  name: string; // e.g. "EODSA Regional Championships 2024 - Gauteng"
  description: string;
  region: 'Gauteng' | 'Free State' | 'Mpumalanga';
  ageCategory: string;
  performanceType: 'Solo' | 'Duet' | 'Trio' | 'Group';
  eventDate: string;
  registrationDeadline: string;
  venue: string;
  status: 'upcoming' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed';
  maxParticipants?: number;
  entryFee: number;
  createdBy: string; // admin id
  createdAt: string;
}

export interface EventEntry {
  id: string;
  eventId: string; // NOW LINKS TO A SPECIFIC EVENT
  contestantId: string;
  eodsaId: string;
  participantIds: string[]; // E-O-D-S-A-IDs of participating dancers
  calculatedFee: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: 'credit_card' | 'bank_transfer';
  submittedAt: string;
  approved: boolean;
  // EODSA Regional Entry Form fields
  itemName: string;
  choreographer: string;
  mastery: string;
  itemStyle: string;
  estimatedDuration: number; // in minutes
}

export interface Performance {
  id: string;
  eventId: string; // NOW LINKS TO EVENT
  eventEntryId: string;
  contestantId: string;
  title: string; // This maps to itemName
  participantNames: string[];
  duration: number; // in minutes (maps to estimatedDuration)
  scheduledTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // EODSA Regional Entry Form fields
  choreographer: string;
  mastery: string;
  itemStyle: string;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  isAdmin: boolean;
  specialization?: string[];
  createdAt: string;
}

// NEW: Direct judge-event assignments
export interface JudgeEventAssignment {
  id: string;
  judgeId: string;
  eventId: string;
  assignedBy: string; // admin id who made the assignment
  assignedAt: string;
  status: 'active' | 'inactive';
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
  eventId: string;
  performanceId: string;
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

// EODSA Regional Entry Form Constants
export const MASTERY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Open',
  'Professional'
];

export const ITEM_STYLES = [
  'Ballet - Classical Variation',
  'Ballet - Contemporary Ballet',
  'Ballet - Demi Character',
  'Contemporary - Lyrical',
  'Contemporary - Modern',
  'Jazz - Commercial',
  'Jazz - Musical Theatre',
  'Jazz - Funk',
  'Hip Hop - Old School',
  'Hip Hop - New School',
  'Hip Hop - Commercial',
  'Tap - Traditional',
  'Tap - Contemporary',
  'Musical Theatre',
  'Commercial Dance',
  'Acrobatic Dance',
  'Cultural/Traditional',
  'Other'
]; 
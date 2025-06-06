// Phase 1 Types for E-O-D-S-A Competition System

export interface ParentGuardianWaiver {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationshipToDancer: string;
  signedDate: string;
  signaturePath: string; // Path to signature image
  idDocumentPath: string; // Path to uploaded ID document
  approved: boolean;
  approvedBy?: string; // Admin who approved
  approvedAt?: string;
}

export interface Dancer {
  id: string; // E-O-D-S-A-ID format
  name: string;
  age: number;
  dateOfBirth: string; // NEW: Date of Birth field
  style: string;
  nationalId: string;
  approved: boolean; // NEW: Admin approval status
  approvedBy?: string; // NEW: Admin who approved
  approvedAt?: string; // NEW: Approval timestamp
  rejectionReason?: string; // NEW: Reason if rejected
  waiver?: ParentGuardianWaiver; // NEW: Waiver for minors under 18
  created_at?: string;
}

export interface GuardianInfo {
  name: string;
  email: string;
  cell: string;
}

export interface Contestant {
  id: string;
  eodsaId: string; // NEW FORMAT: letter + 6 digits (e.g. "E123456")
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  dateOfBirth: string; // NEW: Date of Birth
  guardianInfo?: GuardianInfo; // NEW: Guardian info for minors
  privacyPolicyAccepted: boolean; // NEW: Privacy policy acceptance
  privacyPolicyAcceptedAt?: string; // NEW: Timestamp
  studioName?: string;
  studioInfo?: {
    address: string;
    contactPerson: string;
    registrationNumber?: string; // NEW FORMAT: letter + 6 digits (e.g. "S123456")
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
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'invoice';
  submittedAt: string;
  approved: boolean;
  qualifiedForNationals: boolean;
  itemNumber?: number; // NEW: Item Number for program order
  // EODSA Regional Entry Form fields
  itemName: string;
  choreographer: string;
  mastery: string; // UPDATED: New mastery levels
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
  itemNumber?: number; // NEW: Item Number for program order
  scheduledTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // EODSA Regional Entry Form fields
  choreographer: string;
  mastery: string; // UPDATED: New mastery levels
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

// UPDATED: Age categories to match EODSA requirements exactly
export const AGE_CATEGORIES = [
  '4 & Under',
  '6 & Under', 
  '7-9',
  '10-12',
  '13-14',
  '15-17',
  '18-24',
  '25-39',
  '40+',
  '60+'
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

// UPDATED: Dance styles to match approved list
export const DANCE_STYLES = [
  'Ballet',
  'Ballet Repertoire',
  'Lyrical',
  'Contemporary',
  'Jazz',
  'Hip-Hop',
  'Freestyle/Disco',
  'Musical Theatre',
  'Acrobatics',
  'Tap',
  'Open',
  'Speciality Styles'
];

// UPDATED: Mastery levels to match client requirements
export const MASTERY_LEVELS = [
  'Water (Competition)',
  'Fire (Advanced)',
  'Earth (Eisteddfod)',
  'Air (Special Needs)'
];

// Updated for client requirements
export const ITEM_STYLES = [
  'Ballet',
  'Ballet Repertoire',
  'Lyrical',
  'Contemporary',
  'Jazz',
  'Hip-Hop',
  'Freestyle/Disco',
  'Musical Theatre',
  'Acrobatics',
  'Tap',
  'Open',
  'Speciality Styles'
];

// UPDATED: Time limits to match EODSA requirements exactly
export const TIME_LIMITS = {
  Solo: 2, // minutes
  Duet: 3, // minutes
  Trio: 3, // minutes
  Group: 3.5 // minutes (3:30)
};

// EODSA Fee Structure based on official pricing
export const EODSA_FEES = {
  // Registration fees per person
  REGISTRATION: {
    'Water (Competition)': 250, // R250 PP for Competitive
    'Fire (Advanced)': 250,     // R250 PP for Advanced  
    'Earth (Eisteddfod)': 150,  // R150 PP for Eisteddfod
    'Air (Special Needs)': 150  // R150 PP for Special Needs
  },
  
  // Performance fees by mastery level
  PERFORMANCE: {
    'Water (Competition)': {
      Solo: 300,      // R300 for 1st solo
      SoloAdditional: 180, // R180 for each additional solo
      Duet: 200,      // R200 per dancer
      Trio: 200,      // R200 per dancer  
      Group: 180      // R180 per dancer
    },
    'Fire (Advanced)': {
      Solo: 300,      // R300 for 1st solo
      SoloAdditional: 180, // R180 for each additional solo
      Duet: 200,      // R200 per dancer
      Trio: 200,      // R200 per dancer
      Group: 180      // R180 per dancer
    },
    'Earth (Eisteddfod)': {
      Solo: 200,      // R200 for solo
      SoloAdditional: 200, // R200 for each additional solo
      Duet: 200,      // R200 per dancer
      Trio: 200,      // R200 per dancer
      Group: 180      // R180 per dancer
    },
    'Air (Special Needs)': {
      Solo: 200,      // R200 for solo
      SoloAdditional: 200, // R200 for each additional solo
      Duet: 200,      // R200 per dancer
      Trio: 200,      // R200 per dancer
      Group: 180      // R180 per dancer
    }
  },
  
  // Multiple solo discounts for Competitive/Advanced
  SOLO_PACKAGES: {
    'Water (Competition)': {
      1: 300,   // 1 solo: R300
      2: 520,   // 2 solos: R520 
      3: 700    // 3 solos: R700
    },
    'Fire (Advanced)': {
      1: 300,   // 1 solo: R300
      2: 520,   // 2 solos: R520
      3: 700    // 3 solos: R700
    }
  }
};

// EODSA Fee Calculation Function
export const calculateEODSAFee = (
  masteryLevel: string,
  performanceType: 'Solo' | 'Duet' | 'Trio' | 'Group',
  numberOfParticipants: number,
  isMultipleSolos?: boolean,
  soloCount?: number
): { registrationFee: number; performanceFee: number; totalFee: number } => {
  
  // Registration fee per person
  const registrationFeePerPerson = EODSA_FEES.REGISTRATION[masteryLevel as keyof typeof EODSA_FEES.REGISTRATION] || 0;
  const registrationFee = registrationFeePerPerson * numberOfParticipants;
  
  let performanceFee = 0;
  
  // Handle solo packages for competitive/advanced levels
  if (performanceType === 'Solo' && soloCount && (masteryLevel === 'Water (Competition)' || masteryLevel === 'Fire (Advanced)')) {
    const packages = EODSA_FEES.SOLO_PACKAGES[masteryLevel as keyof typeof EODSA_FEES.SOLO_PACKAGES];
    if (packages && soloCount <= 3) {
      performanceFee = packages[soloCount as keyof typeof packages] || 0;
    } else if (soloCount > 3) {
      // 3 solos package + additional solos
      performanceFee = packages[3] + ((soloCount - 3) * EODSA_FEES.PERFORMANCE[masteryLevel as keyof typeof EODSA_FEES.PERFORMANCE].SoloAdditional);
    }
  } else {
    // Regular performance fees
    const performanceFees = EODSA_FEES.PERFORMANCE[masteryLevel as keyof typeof EODSA_FEES.PERFORMANCE];
    if (performanceFees) {
      const baseFee = performanceFees[performanceType as keyof typeof performanceFees] || 0;
      
      if (performanceType === 'Solo') {
        performanceFee = baseFee;
      } else {
        // For Duet, Trio, Group - multiply by number of dancers
        performanceFee = baseFee * numberOfParticipants;
      }
    }
  }
  
  return {
    registrationFee,
    performanceFee,
    totalFee: registrationFee + performanceFee
  };
};

export interface Studio {
  id: string;
  name: string;
  email: string;
  password: string; // Hashed
  contactPerson: string;
  address: string;
  phone: string;
  registrationNumber: string; // Auto-generated S123456 format
  isActive: boolean;
  createdAt: string;
}

export interface StudioSession {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
} 
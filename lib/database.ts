import { neon } from '@neondatabase/serverless';
import { Contestant, Performance, Judge, Score, Dancer, EventEntry, Ranking, Event } from './types';

// Create database connection using Neon serverless driver
// Only initialize if we have a DATABASE_URL (server-side only)
let sql: ReturnType<typeof neon> | null = null;

const getSql = () => {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(databaseUrl);
  }
  return sql;
};

// Generate E-O-D-S-A-ID
export const generateEODSAId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EODSA-${timestamp.slice(-6)}-${random}`;
};

// Initialize database tables for Phase 1
export const initializeDatabase = async () => {
  try {
    const sqlClient = getSql();
    
    // Check if tables already exist
    try {
      const existingData = await sqlClient`SELECT 1 FROM contestants LIMIT 1` as any[];
      console.log('Database tables already exist and initialized');
      return;
    } catch (error) {
      // Tables don't exist yet, continue with initialization
      console.log('Database not initialized, creating tables...');
    }
    
    console.log('🔄 Initializing database tables...');
    
    // Create contestants table with E-O-D-S-A-ID
    await sqlClient`
      CREATE TABLE IF NOT EXISTS contestants (
        id TEXT PRIMARY KEY,
        eodsa_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        type TEXT CHECK(type IN ('studio', 'private')) NOT NULL,
        studio_name TEXT,
        studio_address TEXT,
        studio_contact_person TEXT,
        studio_registration_number TEXT,
        registration_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create dancers table for individual dancer details
    await sqlClient`
      CREATE TABLE IF NOT EXISTS dancers (
        id TEXT PRIMARY KEY,
        contestant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        style TEXT NOT NULL,
        national_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contestant_id) REFERENCES contestants (id) ON DELETE CASCADE
      )
    `;

    // Create judges table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS judges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        specialization TEXT, -- JSON array of specializations
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create events table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        region TEXT CHECK(region IN ('Gauteng', 'Free State', 'Mpumalanga')) NOT NULL,
        age_category TEXT NOT NULL,
        performance_type TEXT CHECK(performance_type IN ('Solo', 'Duet', 'Trio', 'Group')) NOT NULL,
        event_date TEXT NOT NULL,
        registration_deadline TEXT NOT NULL,
        venue TEXT NOT NULL,
        status TEXT CHECK(status IN ('upcoming', 'registration_open', 'registration_closed', 'in_progress', 'completed')) DEFAULT 'upcoming',
        max_participants INTEGER,
        entry_fee DECIMAL(10,2) NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES judges (id) ON DELETE CASCADE
      )
    `;

    // Create judge_event_assignments table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS judge_event_assignments (
        id TEXT PRIMARY KEY,
        judge_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        assigned_by TEXT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES judges (id) ON DELETE CASCADE,
        UNIQUE(judge_id, event_id) -- One assignment per judge per event
      )
    `;

    // Create event_entries table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS event_entries (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        contestant_id TEXT NOT NULL,
        eodsa_id TEXT NOT NULL,
        participant_ids TEXT NOT NULL, -- JSON array of dancer IDs
        calculated_fee DECIMAL(10,2) NOT NULL,
        payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
        payment_method TEXT CHECK(payment_method IN ('credit_card', 'bank_transfer')),
        submitted_at TEXT NOT NULL,
        approved BOOLEAN DEFAULT FALSE,
        item_name TEXT NOT NULL,
        choreographer TEXT NOT NULL,
        mastery TEXT NOT NULL,
        item_style TEXT NOT NULL,
        estimated_duration INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
        FOREIGN KEY (contestant_id) REFERENCES contestants (id) ON DELETE CASCADE
      )
    `;

    // Create performances table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS performances (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        event_entry_id TEXT NOT NULL,
        contestant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        participant_names TEXT NOT NULL, -- JSON array of participant names
        duration INTEGER NOT NULL,
        choreographer TEXT NOT NULL,
        mastery TEXT NOT NULL,
        item_style TEXT NOT NULL,
        scheduled_time TEXT,
        status TEXT CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
        FOREIGN KEY (event_entry_id) REFERENCES event_entries (id) ON DELETE CASCADE,
        FOREIGN KEY (contestant_id) REFERENCES contestants (id) ON DELETE CASCADE
      )
    `;

    // Create scores table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS scores (
        id TEXT PRIMARY KEY,
        judge_id TEXT NOT NULL,
        performance_id TEXT NOT NULL,
        technical_score DECIMAL(3,1) CHECK(technical_score >= 1 AND technical_score <= 10) NOT NULL,
        artistic_score DECIMAL(3,1) CHECK(artistic_score >= 1 AND artistic_score <= 10) NOT NULL,
        overall_score DECIMAL(3,1) CHECK(overall_score >= 1 AND overall_score <= 10) NOT NULL,
        comments TEXT,
        submitted_at TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE,
        FOREIGN KEY (performance_id) REFERENCES performances (id) ON DELETE CASCADE,
        UNIQUE(judge_id, performance_id)
      )
    `;

    // Create rankings table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS rankings (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        performance_id TEXT NOT NULL,
        total_score DECIMAL(5,2) NOT NULL,
        average_score DECIMAL(4,2) NOT NULL,
        rank_position INTEGER NOT NULL,
        calculated_at TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
        FOREIGN KEY (performance_id) REFERENCES performances (id) ON DELETE CASCADE
      )
    `;

    // Create fee_schedule table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS fee_schedule (
        id TEXT PRIMARY KEY,
        age_category TEXT UNIQUE NOT NULL,
        solo_fee DECIMAL(10,2) NOT NULL,
        duet_fee DECIMAL(10,2) NOT NULL,
        trio_fee DECIMAL(10,2) NOT NULL,
        group_fee DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables created successfully');

    // Create indexes for better performance
    try {
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_contestants_eodsa_id ON contestants(eodsa_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_dancers_contestant_id ON dancers(contestant_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_event_entries_contestant_id ON event_entries(contestant_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_event_entries_event_id ON event_entries(event_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_performances_event_entry_id ON performances(event_entry_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_performances_event_id ON performances(event_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_scores_performance_id ON scores(performance_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_rankings_event_id ON rankings(event_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_judge_assignments_judge_id ON judge_event_assignments(judge_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_judge_assignments_event_id ON judge_event_assignments(event_id)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_events_region ON events(region)`;
      await sqlClient`CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`;
      
      console.log('Database indexes created successfully');
    } catch (indexError) {
      console.warn('Some indexes may already exist, continuing...', indexError);
    }

    // Insert default fee schedule only if it doesn't exist
    const existingFees = await sqlClient`SELECT COUNT(*) as count FROM fee_schedule` as any[];
    if (existingFees[0]?.count === 0) {
    await sqlClient`
      INSERT INTO fee_schedule (id, age_category, solo_fee, duet_fee, trio_fee, group_fee)
      VALUES 
        ('fee_under6', 'Under 6', 150.00, 250.00, 350.00, 450.00),
        ('fee_6_8', '6-8 years', 200.00, 300.00, 400.00, 500.00),
        ('fee_9_11', '9-11 years', 250.00, 350.00, 450.00, 550.00),
        ('fee_12_14', '12-14 years', 300.00, 400.00, 500.00, 600.00),
        ('fee_15_17', '15-17 years', 350.00, 450.00, 550.00, 650.00),
        ('fee_18_plus', '18+ years', 400.00, 500.00, 600.00, 700.00)
      `;
      console.log('Default fee schedule inserted');
    }

    // Create default admin user only if no users exist
    const existingUsers = await sqlClient`SELECT COUNT(*) as count FROM judges` as any[];
    if (existingUsers[0]?.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      
      await sqlClient`
        INSERT INTO judges (id, name, email, password, is_admin, specialization)
        VALUES 
          ('admin1', 'System Admin', 'admin@competition.com', ${hashedAdminPassword}, true, NULL)
      `;
      console.log('Default admin user created: admin@competition.com / admin123');
    }

    console.log('✅ Database initialized successfully - Ready for production use');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Clean database while preserving admin and essential data
export const cleanDatabase = async () => {
  try {
    const sqlClient = getSql();
    
    console.log('🧹 Cleaning database...');
    
    // Delete all data in dependency order (most dependent first)
    await sqlClient`DELETE FROM scores`;
    await sqlClient`DELETE FROM rankings`;
    await sqlClient`DELETE FROM performances`;
    await sqlClient`DELETE FROM event_entries`;
    await sqlClient`DELETE FROM judge_event_assignments`;
    await sqlClient`DELETE FROM events`;
    await sqlClient`DELETE FROM dancers`;
    await sqlClient`DELETE FROM contestants`;
    
    // Keep only admin users, remove regular judges
    await sqlClient`DELETE FROM judges WHERE is_admin = false`;
    
    console.log('✅ Database cleaned successfully - Admin user and fee schedule preserved');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};

// Database operations
export const db = {
  // Contestants
  async createContestant(contestant: Omit<Contestant, 'id' | 'eodsaId' | 'registrationDate' | 'eventEntries'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    const eodsaId = generateEODSAId();
    const registrationDate = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO contestants (id, eodsa_id, name, email, phone, type, studio_name, 
                              studio_address, studio_contact_person, studio_registration_number, registration_date)
      VALUES (${id}, ${eodsaId}, ${contestant.name}, ${contestant.email}, ${contestant.phone}, 
              ${contestant.type}, ${contestant.studioName || null}, 
              ${contestant.studioInfo?.address || null}, ${contestant.studioInfo?.contactPerson || null},
              ${contestant.studioInfo?.registrationNumber || null}, ${registrationDate})
    `;
    
    // Insert dancers
    for (const dancer of contestant.dancers) {
      const dancerId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
      await sqlClient`
        INSERT INTO dancers (id, contestant_id, name, age, style, national_id)
        VALUES (${dancerId}, ${id}, ${dancer.name}, ${dancer.age}, ${dancer.style}, ${dancer.nationalId})
      `;
    }
    
    return { ...contestant, id, eodsaId, registrationDate, eventEntries: [] };
  },

  async getContestantById(id: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM contestants WHERE id = ${id}` as any[];
    if (result.length === 0) return null;
    
    const contestant = result[0];
    const dancers = await sqlClient`SELECT * FROM dancers WHERE contestant_id = ${id}` as any[];
    const eventEntries = await sqlClient`SELECT * FROM event_entries WHERE contestant_id = ${id}` as any[];
    
    return {
      id: contestant.id,
      eodsaId: contestant.eodsa_id,
      name: contestant.name,
      email: contestant.email,
      phone: contestant.phone,
      type: contestant.type,
      studioName: contestant.studio_name,
      studioInfo: contestant.studio_address ? {
        address: contestant.studio_address,
        contactPerson: contestant.studio_contact_person,
        registrationNumber: contestant.studio_registration_number
      } : undefined,
      dancers: dancers.map((d: any) => ({
        id: d.id,
        name: d.name,
        age: d.age,
        style: d.style,
        nationalId: d.national_id
      })),
      registrationDate: contestant.registration_date,
      eventEntries: eventEntries.map((e: any) => ({
        id: e.id,
        eventId: e.event_id,
        contestantId: e.contestant_id,
        eodsaId: e.eodsa_id,
        participantIds: JSON.parse(e.participant_ids),
        calculatedFee: parseFloat(e.calculated_fee),
        paymentStatus: e.payment_status,
        paymentMethod: e.payment_method,
        submittedAt: e.submitted_at,
        approved: e.approved,
        itemName: e.item_name,
        choreographer: e.choreographer,
        mastery: e.mastery,
        itemStyle: e.item_style,
        estimatedDuration: e.estimated_duration
      }))
    } as Contestant;
  },

  async getAllContestants() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM contestants ORDER BY registration_date DESC` as any[];
    return result.map((row: any) => ({
      id: row.id,
      eodsaId: row.eodsa_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      type: row.type,
      studioName: row.studio_name,
      studioInfo: row.studio_address ? {
        address: row.studio_address,
        contactPerson: row.studio_contact_person,
        registrationNumber: row.studio_registration_number
      } : undefined,
      dancers: [], // Will be loaded separately if needed
      registrationDate: row.registration_date,
      eventEntries: []
    })) as Contestant[];
  },

  // Event Entries
  async createEventEntry(eventEntry: Omit<EventEntry, 'id' | 'submittedAt'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    const submittedAt = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO event_entries (id, event_id, contestant_id, eodsa_id, participant_ids, calculated_fee, payment_status, submitted_at, approved, item_name, choreographer, mastery, item_style, estimated_duration)
      VALUES (${id}, ${eventEntry.eventId}, ${eventEntry.contestantId}, ${eventEntry.eodsaId}, ${JSON.stringify(eventEntry.participantIds)}, ${eventEntry.calculatedFee}, ${eventEntry.paymentStatus}, ${submittedAt}, ${eventEntry.approved}, ${eventEntry.itemName}, ${eventEntry.choreographer}, ${eventEntry.mastery}, ${eventEntry.itemStyle}, ${eventEntry.estimatedDuration})
    `;
    
    return { ...eventEntry, id, submittedAt };
  },

  async getEventEntriesByContestant(contestantId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM event_entries WHERE contestant_id = ${contestantId}` as any[];
    return result.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      contestantId: row.contestant_id,
      eodsaId: row.eodsa_id,
      participantIds: JSON.parse(row.participant_ids),
      calculatedFee: parseFloat(row.calculated_fee),
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      submittedAt: row.submitted_at,
      approved: row.approved,
      itemName: row.item_name,
      choreographer: row.choreographer,
      mastery: row.mastery,
      itemStyle: row.item_style,
      estimatedDuration: row.estimated_duration
    })) as EventEntry[];
  },

  async getAllEventEntries() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM event_entries ORDER BY submitted_at DESC` as any[];
    return result.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      contestantId: row.contestant_id,
      eodsaId: row.eodsa_id,
      participantIds: JSON.parse(row.participant_ids),
      calculatedFee: parseFloat(row.calculated_fee),
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      submittedAt: row.submitted_at,
      approved: row.approved,
      itemName: row.item_name,
      choreographer: row.choreographer,
      mastery: row.mastery,
      itemStyle: row.item_style,
      estimatedDuration: row.estimated_duration
    })) as EventEntry[];
  },

  async updateEventEntry(id: string, updates: Partial<EventEntry>) {
    const sqlClient = getSql();
    
    // Simple approach: only support approval updates for now
    if (updates.approved !== undefined) {
      await sqlClient`
        UPDATE event_entries 
        SET approved = ${updates.approved}
        WHERE id = ${id}
      `;
    }
    
    if (updates.paymentStatus !== undefined) {
      await sqlClient`
        UPDATE event_entries 
        SET payment_status = ${updates.paymentStatus}
        WHERE id = ${id}
      `;
    }
    
    if (updates.paymentMethod !== undefined) {
      await sqlClient`
        UPDATE event_entries 
        SET payment_method = ${updates.paymentMethod}
        WHERE id = ${id}
      `;
    }
    
    return updates;
  },

  // Fee Schedule
  async getFeeSchedule() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM fee_schedule ORDER BY age_category` as any[];
    return result.map((row: any) => ({
      ageCategory: row.age_category,
      soloFee: parseFloat(row.solo_fee),
      duetFee: parseFloat(row.duet_fee),
      trioFee: parseFloat(row.trio_fee),
      groupFee: parseFloat(row.group_fee)
    }));
  },

  async calculateFee(ageCategory: string, performanceType: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM fee_schedule WHERE age_category = ${ageCategory}` as any[];
    if (result.length === 0) return 0;
    
    const fees = result[0];
    switch (performanceType.toLowerCase()) {
      case 'solo': return parseFloat(fees.solo_fee);
      case 'duet': return parseFloat(fees.duet_fee);
      case 'trio': return parseFloat(fees.trio_fee);
      case 'group': return parseFloat(fees.group_fee);
      default: return 0;
    }
  },

  // Performances (updated for Phase 1)
  async createPerformance(performance: Omit<Performance, 'id'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    
    await sqlClient`
      INSERT INTO performances (id, event_id, event_entry_id, contestant_id, title, participant_names, duration, choreographer, mastery, item_style, scheduled_time, status)
      VALUES (${id}, ${performance.eventId}, ${performance.eventEntryId}, ${performance.contestantId}, ${performance.title}, ${JSON.stringify(performance.participantNames)}, ${performance.duration}, ${performance.choreographer}, ${performance.mastery}, ${performance.itemStyle}, ${performance.scheduledTime || null}, ${performance.status})
    `;
    
    return { ...performance, id };
  },

  async getAllPerformances() {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT p.*, c.name as contestant_name 
      FROM performances p 
      JOIN contestants c ON p.contestant_id = c.id 
      ORDER BY p.scheduled_time ASC
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      eventEntryId: row.event_entry_id,
      contestantId: row.contestant_id,
      title: row.title,
      participantNames: JSON.parse(row.participant_names),
      duration: row.duration,
      choreographer: row.choreographer,
      mastery: row.mastery,
      itemStyle: row.item_style,
      scheduledTime: row.scheduled_time,
      status: row.status,
      contestantName: row.contestant_name
    })) as (Performance & { contestantName: string })[];
  },

  // Rankings and Tabulation
  async calculateRankings(region?: string, ageCategory?: string, performanceType?: string) {
    const sqlClient = getSql();
    
    // Build dynamic query based on filters - UPDATED for new event schema
    let query = `
      SELECT 
        p.id as performance_id,
        e.region,
        e.age_category,
        e.performance_type,
        p.title,
        c.name as contestant_name,
        AVG(s.technical_score + s.artistic_score + s.overall_score) as total_score,
        AVG((s.technical_score + s.artistic_score + s.overall_score) / 3) as average_score,
        COUNT(s.id) as judge_count
      FROM performances p
      JOIN events e ON p.event_id = e.id
      JOIN contestants c ON p.contestant_id = c.id
      LEFT JOIN scores s ON p.id = s.performance_id
    `;

    const conditions = [];
    if (region) conditions.push(`e.region = '${region}'`);
    if (ageCategory) conditions.push(`e.age_category = '${ageCategory}'`);
    if (performanceType) conditions.push(`e.performance_type = '${performanceType}'`);
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY p.id, e.region, e.age_category, e.performance_type, p.title, c.name
      HAVING COUNT(s.id) > 0
      ORDER BY e.region, e.age_category, e.performance_type, total_score DESC
    `;

    try {
    const result = (await sqlClient.unsafe(query)) as unknown as any[];
      
      // Ensure result is an array
      if (!Array.isArray(result)) {
        console.warn('Rankings query did not return an array:', result);
        return [];
      }

      // If no results, return empty array
      if (result.length === 0) {
        return [];
      }
    
    // Add rankings within each category
    let currentRank = 1;
    let currentCategory = '';
    
    return result.map((row: any, index: number) => {
      const categoryKey = `${row.region}-${row.age_category}-${row.performance_type}`;
      if (categoryKey !== currentCategory) {
        currentRank = 1;
        currentCategory = categoryKey;
      } else if (index > 0 && result[index - 1].total_score !== row.total_score) {
        currentRank = index + 1;
      }
      
      return {
        performanceId: row.performance_id,
        region: row.region,
        ageCategory: row.age_category,
        performanceType: row.performance_type,
        title: row.title,
        contestantName: row.contestant_name,
          totalScore: parseFloat(row.total_score) || 0,
          averageScore: parseFloat(row.average_score) || 0,
        rank: currentRank,
          judgeCount: parseInt(row.judge_count) || 0
      };
    });
    } catch (error) {
      console.error('Error in calculateRankings:', error);
      return [];
    }
  },

  // Keep existing methods for judges and scores...
  async createJudge(judge: Omit<Judge, 'createdAt'> & { id?: string }) {
    const sqlClient = getSql();
    const id = judge.id || Date.now().toString();
    
    await sqlClient`
      INSERT INTO judges (id, name, email, password, is_admin, specialization)
      VALUES (${id}, ${judge.name}, ${judge.email}, ${judge.password}, 
              ${judge.isAdmin}, ${JSON.stringify(judge.specialization || [])})
    `;
    
    return { ...judge, id };
  },

  async getJudgeEventAssignment(judgeId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT * FROM judge_event_assignments WHERE judge_id = ${judgeId}
    ` as any[];
    
    if (result.length === 0) return null;
    
    const assignment = result[0];
    return {
      id: assignment.id,
      judgeId: assignment.judge_id,
      eventId: assignment.event_id,
      assignedBy: assignment.assigned_by,
      createdAt: assignment.assigned_at
    };
  },

  async getJudgeByEmail(email: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM judges WHERE email = ${email}` as any[];
    if (result.length === 0) return null;
    
    const judge = result[0];
    return {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      password: judge.password,
      isAdmin: judge.is_admin,
      specialization: judge.specialization ? JSON.parse(judge.specialization) : []
    } as Judge;
  },

  async getJudgeById(id: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM judges WHERE id = ${id}` as any[];
    if (result.length === 0) return null;
    
    const judge = result[0];
    return {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      password: judge.password,
      isAdmin: judge.is_admin,
      specialization: judge.specialization ? JSON.parse(judge.specialization) : [],
      createdAt: judge.created_at
    } as Judge;
  },

  async getAllJudges() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM judges` as any[];
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      isAdmin: row.is_admin,
      specialization: row.specialization ? JSON.parse(row.specialization) : [],
      createdAt: row.created_at
    })) as Judge[];
  },

  // Scores (keep existing implementation)
  async createScore(score: Omit<Score, 'id' | 'submittedAt'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    const submittedAt = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO scores (id, judge_id, performance_id, technical_score, artistic_score, overall_score, comments, submitted_at)
      VALUES (${id}, ${score.judgeId}, ${score.performanceId}, ${score.technicalScore}, 
              ${score.artisticScore}, ${score.overallScore}, ${score.comments}, ${submittedAt})
    `;
    
    return { ...score, id, submittedAt };
  },

  async updateScore(id: string, updates: Partial<Score>) {
    const sqlClient = getSql();
    await sqlClient`
      UPDATE scores 
      SET technical_score = ${updates.technicalScore}, artistic_score = ${updates.artisticScore}, 
          overall_score = ${updates.overallScore}, comments = ${updates.comments}
      WHERE id = ${id}
    `;
  },

  async getScoreByJudgeAndPerformance(judgeId: string, performanceId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT * FROM scores WHERE judge_id = ${judgeId} AND performance_id = ${performanceId}
    ` as any[];
    
    if (result.length === 0) return null;
    
    const score = result[0];
    return {
      id: score.id,
      judgeId: score.judge_id,
      performanceId: score.performance_id,
      technicalScore: parseFloat(score.technical_score),
      artisticScore: parseFloat(score.artistic_score),
      overallScore: parseFloat(score.overall_score),
      comments: score.comments,
      submittedAt: score.submitted_at
    } as Score;
  },

  async getScoresByPerformance(performanceId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT s.*, j.name as judge_name 
      FROM scores s 
      JOIN judges j ON s.judge_id = j.id 
      WHERE s.performance_id = ${performanceId}
      ORDER BY s.submitted_at
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      judgeId: row.judge_id,
      performanceId: row.performance_id,
      technicalScore: parseFloat(row.technical_score),
      artisticScore: parseFloat(row.artistic_score),
      overallScore: parseFloat(row.overall_score),
      comments: row.comments,
      submittedAt: row.submitted_at,
      judgeName: row.judge_name
    })) as (Score & { judgeName: string })[];
  },

  // NEW: Event management methods
  async createEvent(event: Omit<Event, 'id' | 'createdAt'>) {
    const sqlClient = getSql();
    const id = `event-${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO events (id, name, description, region, age_category, performance_type, event_date, registration_deadline, venue, status, max_participants, entry_fee, created_by, created_at)
      VALUES (${id}, ${event.name}, ${event.description}, ${event.region}, ${event.ageCategory}, ${event.performanceType}, ${event.eventDate}, ${event.registrationDeadline}, ${event.venue}, ${event.status}, ${event.maxParticipants || null}, ${event.entryFee}, ${event.createdBy}, ${createdAt})
    `;
    
    return { ...event, id, createdAt };
  },

  async getAllEvents() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM events ORDER BY event_date ASC` as any[];
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      region: row.region,
      ageCategory: row.age_category,
      performanceType: row.performance_type,
      eventDate: row.event_date,
      registrationDeadline: row.registration_deadline,
      venue: row.venue,
      status: row.status,
      maxParticipants: row.max_participants,
      entryFee: parseFloat(row.entry_fee),
      createdBy: row.created_by,
      createdAt: row.created_at
    })) as Event[];
  },

  async getEventById(eventId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM events WHERE id = ${eventId}` as any[];
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      region: row.region,
      ageCategory: row.age_category,
      performanceType: row.performance_type,
      eventDate: row.event_date,
      registrationDeadline: row.registration_deadline,
      venue: row.venue,
      status: row.status,
      maxParticipants: row.max_participants,
      entryFee: parseFloat(row.entry_fee),
      createdBy: row.created_by,
      createdAt: row.created_at
    } as Event;
  },

  // NEW: Judge Event Assignment methods
  async createJudgeEventAssignment(assignment: {
    judgeId: string;
    eventId: string;
    assignedBy: string;
  }) {
    const sqlClient = getSql();
    const id = `assignment-${Date.now()}`;
    const assignedAt = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO judge_event_assignments (id, judge_id, event_id, assigned_by, assigned_at, status)
      VALUES (${id}, ${assignment.judgeId}, ${assignment.eventId}, ${assignment.assignedBy}, ${assignedAt}, 'active')
    `;
    
    return { ...assignment, id, assignedAt, status: 'active' as const };
  },

  async getJudgeAssignments(judgeId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT jea.*, e.name as event_name, e.description as event_description, e.event_date, e.venue
      FROM judge_event_assignments jea
      JOIN events e ON jea.event_id = e.id
      WHERE jea.judge_id = ${judgeId} AND jea.status = 'active'
      ORDER BY e.event_date ASC
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      judgeId: row.judge_id,
      eventId: row.event_id,
      assignedBy: row.assigned_by,
      assignedAt: row.assigned_at,
      status: row.status,
      event: {
        id: row.event_id,
        name: row.event_name,
        description: row.event_description,
        eventDate: row.event_date,
        venue: row.venue
      }
    }));
  },

  async getAllJudgeAssignments() {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT jea.*, j.name as judge_name, j.email as judge_email, e.name as event_name
      FROM judge_event_assignments jea
      JOIN judges j ON jea.judge_id = j.id
      JOIN events e ON jea.event_id = e.id
      WHERE jea.status = 'active'
      ORDER BY jea.assigned_at DESC
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      judgeId: row.judge_id,
      eventId: row.event_id,
      assignedBy: row.assigned_by,
      assignedAt: row.assigned_at,
      status: row.status,
      judgeName: row.judge_name,
      judgeEmail: row.judge_email,
      eventName: row.event_name
    }));
  },

  // NEW: Get performances by event ID
  async getPerformancesByEvent(eventId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT p.*, c.name as contestant_name 
      FROM performances p 
      JOIN contestants c ON p.contestant_id = c.id 
      WHERE p.event_id = ${eventId}
      ORDER BY p.scheduled_time ASC
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      eventEntryId: row.event_entry_id,
      contestantId: row.contestant_id,
      title: row.title,
      participantNames: JSON.parse(row.participant_names),
      duration: row.duration,
      choreographer: row.choreographer,
      mastery: row.mastery,
      itemStyle: row.item_style,
      scheduledTime: row.scheduled_time,
      status: row.status,
      contestantName: row.contestant_name
    })) as (Performance & { contestantName: string })[];
  },

  // Database cleaning - reset all data except admin users
  async cleanDatabase() {
    const sqlClient = getSql();
    
    console.log('🧹 Cleaning database...');
    
    // Delete all data in dependency order (most dependent first)
    await sqlClient`DELETE FROM scores`;
    await sqlClient`DELETE FROM rankings`;
    await sqlClient`DELETE FROM performances`;
    await sqlClient`DELETE FROM event_entries`;
    await sqlClient`DELETE FROM judge_event_assignments`;
    await sqlClient`DELETE FROM events`;
    await sqlClient`DELETE FROM dancers`;
    await sqlClient`DELETE FROM contestants`;
    
    // Keep only admin users, remove regular judges
    await sqlClient`DELETE FROM judges WHERE is_admin = false`;
    
    console.log('✅ Database cleaned successfully - Admin user and fee schedule preserved');
  }
};

export default db; 
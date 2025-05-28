import { neon } from '@neondatabase/serverless';
import { Contestant, Performance, Judge, Score } from './types';

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

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    const sqlClient = getSql();
    
    // Create contestants table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS contestants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        type TEXT CHECK(type IN ('studio', 'private')) NOT NULL,
        studio_name TEXT,
        registration_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create performances table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS performances (
        id TEXT PRIMARY KEY,
        contestant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        duration INTEGER NOT NULL,
        scheduled_time TEXT,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Create indexes for better performance
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_performances_contestant_id ON performances(contestant_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_scores_performance_id ON scores(performance_id)`;
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id)`;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database operations
export const db = {
  // Contestants
  async createContestant(contestant: Omit<Contestant, 'id' | 'registrationDate' | 'performances'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    const registrationDate = new Date().toISOString();
    
    await sqlClient`
      INSERT INTO contestants (id, name, email, phone, type, studio_name, registration_date)
      VALUES (${id}, ${contestant.name}, ${contestant.email}, ${contestant.phone}, 
              ${contestant.type}, ${contestant.studioName || null}, ${registrationDate})
    `;
    
    return { ...contestant, id, registrationDate, performances: [] };
  },

  async getContestantById(id: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM contestants WHERE id = ${id}` as any[];
    if (result.length === 0) return null;
    
    const contestant = result[0];
    const performances = await sqlClient`SELECT * FROM performances WHERE contestant_id = ${id}` as any[];
    
    return {
      id: contestant.id,
      name: contestant.name,
      email: contestant.email,
      phone: contestant.phone,
      type: contestant.type,
      studioName: contestant.studio_name,
      registrationDate: contestant.registration_date,
      performances: performances
    } as Contestant;
  },

  async getAllContestants() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM contestants ORDER BY registration_date DESC` as any[];
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      type: row.type,
      studioName: row.studio_name,
      registrationDate: row.registration_date,
      performances: []
    })) as Contestant[];
  },

  async updateContestant(id: string, updates: Partial<Contestant>) {
    const sqlClient = getSql();
    await sqlClient`
      UPDATE contestants 
      SET name = ${updates.name}, email = ${updates.email}, phone = ${updates.phone}, 
          type = ${updates.type}, studio_name = ${updates.studioName || null}
      WHERE id = ${id}
    `;
  },

  async deleteContestant(id: string) {
    const sqlClient = getSql();
    await sqlClient`DELETE FROM contestants WHERE id = ${id}`;
  },

  // Performances
  async createPerformance(performance: Omit<Performance, 'id'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    
    await sqlClient`
      INSERT INTO performances (id, contestant_id, title, category, duration, scheduled_time)
      VALUES (${id}, ${performance.contestantId}, ${performance.title}, 
              ${performance.category}, ${performance.duration}, ${performance.scheduledTime || null})
    `;
    
    return { ...performance, id };
  },

  async getPerformanceById(id: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM performances WHERE id = ${id}` as any[];
    if (result.length === 0) return null;
    
    const perf = result[0];
    return {
      id: perf.id,
      contestantId: perf.contestant_id,
      title: perf.title,
      category: perf.category,
      duration: perf.duration,
      scheduledTime: perf.scheduled_time
    } as Performance;
  },

  async getAllPerformances() {
    const sqlClient = getSql();
    const result = await sqlClient`
      SELECT p.*, c.name as contestant_name 
      FROM performances p 
      JOIN contestants c ON p.contestant_id = c.id 
      ORDER BY p.scheduled_time, p.created_at
    ` as any[];
    
    return result.map((row: any) => ({
      id: row.id,
      contestantId: row.contestant_id,
      title: row.title,
      category: row.category,
      duration: row.duration,
      scheduledTime: row.scheduled_time,
      contestantName: row.contestant_name
    }));
  },

  async getPerformancesByContestant(contestantId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM performances WHERE contestant_id = ${contestantId}` as any[];
    return result.map((row: any) => ({
      id: row.id,
      contestantId: row.contestant_id,
      title: row.title,
      category: row.category,
      duration: row.duration,
      scheduledTime: row.scheduled_time
    })) as Performance[];
  },

  async updatePerformance(id: string, updates: Partial<Performance>) {
    const sqlClient = getSql();
    await sqlClient`
      UPDATE performances 
      SET title = ${updates.title}, category = ${updates.category}, 
          duration = ${updates.duration}, scheduled_time = ${updates.scheduledTime || null}
      WHERE id = ${id}
    `;
  },

  async deletePerformance(id: string) {
    const sqlClient = getSql();
    await sqlClient`DELETE FROM performances WHERE id = ${id}`;
  },

  // Judges
  async createJudge(judge: Omit<Judge, 'id'>) {
    const sqlClient = getSql();
    const id = Date.now().toString();
    
    await sqlClient`
      INSERT INTO judges (id, name, email, password, is_admin)
      VALUES (${id}, ${judge.name}, ${judge.email}, ${judge.password}, ${judge.isAdmin})
    `;
    
    return { ...judge, id };
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
      isAdmin: judge.is_admin
    } as Judge;
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
      isAdmin: judge.is_admin
    } as Judge;
  },

  async getAllJudges() {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT id, name, email, is_admin FROM judges ORDER BY name` as any[];
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: '', // Don't return password in list
      isAdmin: row.is_admin
    })) as Judge[];
  },

  async updateJudge(id: string, updates: Partial<Judge>) {
    const sqlClient = getSql();
    await sqlClient`
      UPDATE judges 
      SET name = ${updates.name}, email = ${updates.email}, is_admin = ${updates.isAdmin}
      WHERE id = ${id}
    `;
  },

  async updateJudgePassword(id: string, hashedPassword: string) {
    const sqlClient = getSql();
    await sqlClient`UPDATE judges SET password = ${hashedPassword} WHERE id = ${id}`;
  },

  async deleteJudge(id: string) {
    const sqlClient = getSql();
    await sqlClient`DELETE FROM judges WHERE id = ${id}`;
  },

  // Scores
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

  async getScoreById(id: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM scores WHERE id = ${id}` as any[];
    if (result.length === 0) return null;
    
    const score = result[0];
    return {
      id: score.id,
      judgeId: score.judge_id,
      performanceId: score.performance_id,
      technicalScore: Number(score.technical_score),
      artisticScore: Number(score.artistic_score),
      overallScore: Number(score.overall_score),
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
      technicalScore: Number(row.technical_score),
      artisticScore: Number(row.artistic_score),
      overallScore: Number(row.overall_score),
      comments: row.comments,
      submittedAt: row.submitted_at,
      judgeName: row.judge_name
    }));
  },

  async getScoresByJudge(judgeId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM scores WHERE judge_id = ${judgeId} ORDER BY submitted_at DESC` as any[];
    return result.map((row: any) => ({
      id: row.id,
      judgeId: row.judge_id,
      performanceId: row.performance_id,
      technicalScore: Number(row.technical_score),
      artisticScore: Number(row.artistic_score),
      overallScore: Number(row.overall_score),
      comments: row.comments,
      submittedAt: row.submitted_at
    })) as Score[];
  },

  async getScoreByJudgeAndPerformance(judgeId: string, performanceId: string) {
    const sqlClient = getSql();
    const result = await sqlClient`SELECT * FROM scores WHERE judge_id = ${judgeId} AND performance_id = ${performanceId}` as any[];
    if (result.length === 0) return null;
    
    const score = result[0];
    return {
      id: score.id,
      judgeId: score.judge_id,
      performanceId: score.performance_id,
      technicalScore: Number(score.technical_score),
      artisticScore: Number(score.artistic_score),
      overallScore: Number(score.overall_score),
      comments: score.comments,
      submittedAt: score.submitted_at
    } as Score;
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

  async deleteScore(id: string) {
    const sqlClient = getSql();
    await sqlClient`DELETE FROM scores WHERE id = ${id}`;
  },

  // Helper functions
  async calculateAverageScore(performanceId: string) {
    const scores = await this.getScoresByPerformance(performanceId);
    if (scores.length === 0) return 0;
    
    const totalScore = scores.reduce((sum, score) => {
      return sum + (score.technicalScore + score.artisticScore + score.overallScore) / 3;
    }, 0);
    
    return totalScore / scores.length;
  }
};

export default db; 
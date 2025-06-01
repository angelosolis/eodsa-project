import { Contestant, Performance, Judge, Score } from './types';
import { db, initializeDatabase } from './database';

// Initialize database on first import
let dbInitialized = false;

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

// Helper functions that use the database
export async function addContestant(contestant: Omit<Contestant, 'id' | 'registrationDate' | 'performances'>) {
  await ensureDbInitialized();
  return await db.createContestant(contestant);
}

export async function addScore(score: Omit<Score, 'id' | 'submittedAt'>) {
  await ensureDbInitialized();
  return await db.createScore(score);
}

export async function getContestantById(id: string) {
  await ensureDbInitialized();
  return await db.getContestantById(id);
}

export async function getAllContestants() {
  await ensureDbInitialized();
  return await db.getAllContestants();
}

export async function getAllPerformances() {
  await ensureDbInitialized();
  return await db.getAllPerformances();
}

export async function getJudgeByEmail(email: string) {
  await ensureDbInitialized();
  return await db.getJudgeByEmail(email);
}

export async function getAllJudges() {
  await ensureDbInitialized();
  return await db.getAllJudges();
}

export async function getScoresForPerformance(performanceId: string) {
  await ensureDbInitialized();
  return await db.getScoresByPerformance(performanceId);
}

export async function addPerformance(performance: Omit<Performance, 'id'>) {
  await ensureDbInitialized();
  return await db.createPerformance(performance);
}

export async function addJudge(judge: Omit<Judge, 'id'>) {
  await ensureDbInitialized();
  return await db.createJudge(judge);
}

// Export the database instance for direct access if needed
export { db }; 
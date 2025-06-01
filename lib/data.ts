import { Contestant, Performance, Judge, Score, Event } from './types';
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
export const getRecentContestants = async (limit = 10) => {
  await ensureDbInitialized();
  return db.getAllContestants();
};

export const getRecentPerformances = async (limit = 10) => {
  await ensureDbInitialized();
  return db.getAllPerformances();
};

export const getTopRankings = async (limit = 10) => {
  await ensureDbInitialized();
  return db.calculateRankings();
};

export const getJudgeStats = async () => {
  await ensureDbInitialized();
  return db.getAllJudges();
};

export const getEventSummary = async () => {
  await ensureDbInitialized();
  return db.getAllEvents();
};

export const getContestantCount = async () => {
  await ensureDbInitialized();
  const contestants = await db.getAllContestants();
  return contestants.length;
};

export const getPerformanceCount = async () => {
  await ensureDbInitialized();
  const performances = await db.getAllPerformances();
  return performances.length;
};

export const getJudgeCount = async () => {
  await ensureDbInitialized();
  const judges = await db.getAllJudges();
  return judges.length;
};

export const getEventCount = async () => {
  await ensureDbInitialized();
  const events = await db.getAllEvents();
  return events.length;
};

export const getTotalEventEntries = async () => {
  await ensureDbInitialized();
  const entries = await db.getAllEventEntries();
  return entries.length;
};

// Export the database instance for direct access if needed
export { db }; 
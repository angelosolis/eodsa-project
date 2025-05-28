import { Contestant, Performance, Judge, Score } from './types';
import { db, initializeDatabase } from './database';
import bcrypt from 'bcryptjs';

// Initialize database on first import
let dbInitialized = false;

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    await seedInitialData();
    dbInitialized = true;
  }
};

// Seed initial data if tables are empty
const seedInitialData = async () => {
  try {
    // Check if we already have data
    const existingContestants = await db.getAllContestants();
    if (existingContestants.length > 0) return;

    // Create initial contestants
    await db.createContestant({
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '555-0101',
      type: 'studio',
      studioName: 'Elite Dance Academy'
    });

    await db.createContestant({
      name: 'Mike Chen',
      email: 'mike@email.com',
      phone: '555-0102',
      type: 'private'
    });

    // Get the created contestants to get their IDs
    const contestants = await db.getAllContestants();
    const sarah = contestants.find(c => c.email === 'sarah@email.com');
    const mike = contestants.find(c => c.email === 'mike@email.com');

    if (sarah) {
      await db.createPerformance({
        contestantId: sarah.id,
        title: 'Contemporary Solo',
        category: 'Contemporary',
        duration: 3
      });
    }

    if (mike) {
      await db.createPerformance({
        contestantId: mike.id,
        title: 'Hip Hop Routine',
        category: 'Hip Hop',
        duration: 4
      });
    }

    // Create initial judges with hashed passwords
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    await db.createJudge({
      name: 'Judge Anderson',
      email: 'judge1@competition.com',
      password: hashedPassword1,
      isAdmin: false
    });

    await db.createJudge({
      name: 'Admin User',
      email: 'admin@competition.com',
      password: hashedAdminPassword,
      isAdmin: true
    });

    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial data:', error);
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

export async function getPerformanceById(id: string) {
  await ensureDbInitialized();
  return await db.getPerformanceById(id);
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

export async function calculateAverageScore(performanceId: string) {
  await ensureDbInitialized();
  return await db.calculateAverageScore(performanceId);
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
#!/usr/bin/env node

/**
 * Migration Script: Update Scoring System
 * 
 * This script migrates the database from the old 3-criteria scoring system
 * (technical_score, artistic_score, overall_score) with 1-10 range
 * to the new 5-criteria scoring system with 0-20 range:
 * - technical_score (0-20)
 * - musical_score (0-20) 
 * - performance_score (0-20)
 * - styling_score (0-20)
 * - overall_impression_score (0-20)
 */

const { neon } = require('@neondatabase/serverless');

async function migrateScoring() {
  console.log('🚀 Starting scoring system migration...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if migration is needed
    console.log('🔍 Checking current schema...');
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scores' 
      AND table_schema = 'public'
    `;
    const columnNames = tableInfo.map(col => col.column_name);
    
    const hasNewColumns = columnNames.includes('musical_score') && 
                         columnNames.includes('performance_score') && 
                         columnNames.includes('styling_score') && 
                         columnNames.includes('overall_impression_score');
    
    if (hasNewColumns) {
      console.log('✅ Database already has new scoring schema');
      return;
    }
    
    console.log('🔄 Migrating to new 5-criteria scoring system...');
    
    // Backup existing scores
    console.log('📦 Backing up existing scores...');
    const existingScores = await sql`SELECT * FROM scores`;
    console.log(`Found ${existingScores.length} existing scores to migrate`);
    
    // Create new scores table
    console.log('🏗️ Creating new scores table...');
    await sql`
      CREATE TABLE scores_new (
        id TEXT PRIMARY KEY,
        judge_id TEXT NOT NULL,
        performance_id TEXT NOT NULL,
        technical_score DECIMAL(3,1) CHECK(technical_score >= 0 AND technical_score <= 20) NOT NULL,
        musical_score DECIMAL(3,1) CHECK(musical_score >= 0 AND musical_score <= 20) NOT NULL,
        performance_score DECIMAL(3,1) CHECK(performance_score >= 0 AND performance_score <= 20) NOT NULL,
        styling_score DECIMAL(3,1) CHECK(styling_score >= 0 AND styling_score <= 20) NOT NULL,
        overall_impression_score DECIMAL(3,1) CHECK(overall_impression_score >= 0 AND overall_impression_score <= 20) NOT NULL,
        comments TEXT,
        submitted_at TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (judge_id) REFERENCES judges (id) ON DELETE CASCADE,
        FOREIGN KEY (performance_id) REFERENCES performances (id) ON DELETE CASCADE,
        UNIQUE(judge_id, performance_id)
      )
    `;
    
    // Migrate existing data
    console.log('📊 Migrating existing scores...');
    for (const score of existingScores) {
      // Convert old 1-10 scale to new 0-20 scale
      // Multiply by 2 to convert range, ensuring minimum of 2 (was 1)
      const technicalScore = Math.max(2, (score.technical_score || 1) * 2);
      const musicalScore = Math.max(2, (score.artistic_score || 1) * 2); // Map artistic → musical
      const performanceScore = Math.max(2, (score.overall_score || 1) * 2); // Map overall → performance
      const stylingScore = 10; // Default middle value for new criterion
      const overallImpressionScore = Math.round((technicalScore + musicalScore + performanceScore + stylingScore) / 4);
      
      await sql`
        INSERT INTO scores_new (
          id, judge_id, performance_id, 
          technical_score, musical_score, performance_score, styling_score, overall_impression_score,
          comments, submitted_at, created_at
        ) VALUES (
          ${score.id}, ${score.judge_id}, ${score.performance_id},
          ${technicalScore}, ${musicalScore}, ${performanceScore}, ${stylingScore}, ${overallImpressionScore},
          ${score.comments}, ${score.submitted_at}, ${score.created_at}
        )
      `;
    }
    
    // Replace old table with new one
    console.log('🔄 Replacing old table...');
    await sql`DROP TABLE scores`;
    await sql`ALTER TABLE scores_new RENAME TO scores`;
    
    // Recreate indexes
    console.log('📇 Recreating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_scores_performance_id ON scores(performance_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id)`;
    
    console.log('✅ Migration completed successfully!');
    console.log(`📈 Migrated ${existingScores.length} scores to new 5-criteria system`);
    console.log('');
    console.log('🎯 New Scoring System:');
    console.log('   • Technique: 0-20 points');
    console.log('   • Musicality: 0-20 points');
    console.log('   • Performance: 0-20 points');
    console.log('   • Styling: 0-20 points');
    console.log('   • Overall Impression: 0-20 points');
    console.log('   • Total: 100 points per judge');
    console.log('   • Ranking: Bronze (≤69%) • Silver (70-74%) • Silver Plus (75-79%) • Gold (80-89%) • Pro Gold (90%+)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateScoring().then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
}

module.exports = { migrateScoring }; 
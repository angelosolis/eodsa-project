# 🎯 Scoring System Migration Guide

## Overview

The judging system has been updated from a **3-criteria system** to a **5-criteria system** with percentage-based rankings.

### Old System (3 Criteria)
- **Technique**: 1-10 points
- **Artistry**: 1-10 points  
- **Presentation**: 1-10 points
- **Total**: 30 points per judge

### New System (5 Criteria)
- **Technique**: 0-20 points
- **Musicality**: 0-20 points
- **Performance**: 0-20 points
- **Styling**: 0-20 points
- **Overall Impression**: 0-20 points
- **Total**: 100 points per judge

## Ranking System

Performances are now ranked by percentage with achievement levels:

- **Bronze**: ≤69%
- **Silver**: 70-74%
- **Silver Plus**: 75-79%
- **Gold**: 80-89%
- **Pro Gold**: 90%+

## Database Migration Required

⚠️ **IMPORTANT**: The database schema has changed and requires migration.

### Option 1: Automatic Migration (Recommended)

The system will automatically detect and migrate the database when you restart the application. Existing scores will be converted:

- Old scores (1-10) → New scores (2-20) by multiplying by 2
- Artistic Score → Musical Score
- Overall Score → Performance Score  
- Styling Score → Default value of 10
- Overall Impression → Calculated average

### Option 2: Manual Migration

If you prefer to run the migration manually:

```bash
# Run the migration script
node scripts/migrate-scoring.js
```

### Option 3: Fresh Start

If you want to start with a clean database:

```bash
# This will clear all existing data and create new schema
npm run dev
# Then visit the admin panel and use "Clean Database" option
```

## What's Updated

### ✅ Judge Dashboard
- New 5-criteria scoring interface
- 0-20 point input fields with progress bars
- Real-time percentage calculation
- Live ranking level display

### ✅ Admin Rankings
- Percentage-based rankings
- Achievement level badges (Bronze, Silver, Gold, etc.)
- Updated score calculations
- Position rankings maintained for competitive placement

### ✅ Database Schema
- New `scores` table with 5 criteria fields
- Updated constraints (0-20 range)
- Automatic migration support

### ✅ APIs
- Updated scoring endpoints
- New field validation
- Backward compatibility during migration

## Testing the New System

1. **Start the application**: `npm run dev`
2. **Login as a judge**: Use existing judge credentials
3. **Score a performance**: Try the new 5-criteria interface
4. **Check rankings**: View the updated admin rankings page
5. **Verify percentages**: Ensure calculations are correct

## Rollback (If Needed)

If you need to rollback to the old system:

1. Restore your database backup (if you made one)
2. Revert the code changes
3. Restart the application

## Support

If you encounter any issues during migration:

1. Check the console logs for error messages
2. Ensure your database connection is working
3. Verify all environment variables are set
4. Contact support if problems persist

---

**Migration Status**: Ready to deploy
**Compatibility**: Maintains existing data with automatic conversion
**Downtime**: Minimal (only during restart) 
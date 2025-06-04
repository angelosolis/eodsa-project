import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase, unifiedDb } from '@/lib/database';
import { emailService } from '@/lib/email';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureDbInitialized();
    // This would get all event entries - implement if needed for admin
    return NextResponse.json({ message: 'Event entries endpoint' });
  } catch (error) {
    console.error('Error fetching event entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'eventId', 'contestantId', 'eodsaId', 
      'participantIds', 'calculatedFee', 'paymentMethod',
      'itemName', 'choreographer', 'mastery', 'itemStyle', 'estimatedDuration'
    ];
    
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) { // Allow 0 for estimatedDuration
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate participant IDs array
    if (!Array.isArray(body.participantIds) || body.participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Get event details to validate participant limits
    const event = await db.getEventById(body.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 400 }
      );
    }

    // UNIFIED SYSTEM VALIDATION: Check dancer eligibility
    // Validate each participant has proper approvals
    for (const participantId of body.participantIds) {
      // Check if this is a unified system dancer
      const dancer = await unifiedDb.getDancerById(participantId);
      
      if (dancer) {
        // This is a unified system dancer - requires admin approval
        if (!dancer.approved) {
          return NextResponse.json(
            { 
              error: `Dancer ${dancer.name} (${dancer.eodsaId}) is not approved by admin. Please wait for admin approval before entering competitions.`,
              requiresAdminApproval: true,
              dancerId: participantId
            },
            { status: 403 }
          );
        }

        // Check if dancer has studio affiliation - if so, needs studio approval too
        const studioApplications = await unifiedDb.getDancerApplications(participantId);
        const acceptedApplications = studioApplications.filter(app => app.status === 'accepted');
        
        if (acceptedApplications.length === 0) {
          // Dancer has no studio affiliation - this is allowed for independent dancers
          console.log(`Independent dancer ${dancer.name} entering competition`);
        } else {
          // Dancer has studio affiliation - this is also valid
          console.log(`Studio-affiliated dancer ${dancer.name} entering competition`);
        }
      } else {
        // Check if this is an old system participant (fallback compatibility)
        const contestant = await db.getContestantById(body.contestantId);
        if (!contestant) {
          return NextResponse.json(
            { error: 'Invalid contestant or participant data' },
            { status: 400 }
          );
        }
        
        // For old system - validate participant exists in contestant's dancers
        const participantExists = contestant.dancers?.some((d: any) => d.id === participantId);
        if (!participantExists) {
          return NextResponse.json(
            { error: `Participant ${participantId} not found in contestant record` },
            { status: 400 }
          );
        }
      }
    }

    // Validate performance type participant limits
    const participantCount = body.participantIds.length;
    const performanceType = event.performanceType;
    
    const limits = {
      'Solo': { min: 1, max: 1 },
      'Duet': { min: 2, max: 2 },
      'Trio': { min: 3, max: 3 },
      'Group': { min: 4, max: 30 }
    };
    
    const limit = limits[performanceType as keyof typeof limits];
    if (!limit) {
      return NextResponse.json(
        { error: 'Invalid performance type in event' },
        { status: 400 }
      );
    }
    
    if (participantCount < limit.min || participantCount > limit.max) {
      return NextResponse.json(
        { error: `${performanceType} requires ${limit.min === limit.max ? limit.min : `${limit.min}-${limit.max}`} participant(s)` },
        { status: 400 }
      );
    }

    // Create event entry
    const eventEntry = await db.createEventEntry({
      eventId: body.eventId,
      contestantId: body.contestantId,
      eodsaId: body.eodsaId,
      participantIds: body.participantIds,
      calculatedFee: body.calculatedFee,
      paymentStatus: body.paymentStatus || 'pending',
      paymentMethod: body.paymentMethod,
      approved: body.approved || false,
      itemName: body.itemName,
      choreographer: body.choreographer,
      mastery: body.mastery,
      itemStyle: body.itemStyle,
      estimatedDuration: body.estimatedDuration
    });

    // Send competition entry confirmation email
    try {
      // Get contestant details for email
      const contestant = await db.getContestantById(body.contestantId);
      if (contestant && contestant.email) {
        await emailService.sendCompetitionEntryEmail(
          contestant.name,
          contestant.email,
          event.name,
          body.itemName,
          event.performanceType,
          body.calculatedFee
        );
        console.log('Competition entry email sent successfully to:', contestant.email);
      }
    } catch (emailError) {
      console.error('Failed to send competition entry email:', emailError);
      // Don't fail the entry if email fails
    }

    return NextResponse.json(eventEntry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event entry:', error);
    
    // Handle specific database errors
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { error: 'Invalid contestant ID or participant IDs' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create event entry' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { studioDb, initializeDatabase } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Submit a waiver for a minor dancer
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const formData = await request.formData();
    
    const dancerId = formData.get('dancerId') as string;
    const parentName = formData.get('parentName') as string;
    const parentEmail = formData.get('parentEmail') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const relationshipToDancer = formData.get('relationshipToDancer') as string;
    const signatureFile = formData.get('signature') as File;
    const idDocumentFile = formData.get('idDocument') as File;

    if (!dancerId || !parentName || !parentEmail || !parentPhone || !relationshipToDancer || !signatureFile || !idDocumentFile) {
      return NextResponse.json(
        { error: 'All fields including signature and ID document are required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'waivers');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save signature file
    const signatureExtension = signatureFile.name.split('.').pop();
    const signatureFilename = `signature_${dancerId}_${Date.now()}.${signatureExtension}`;
    const signaturePath = path.join(uploadsDir, signatureFilename);
    const signatureBuffer = Buffer.from(await signatureFile.arrayBuffer());
    await writeFile(signaturePath, signatureBuffer);

    // Save ID document file
    const idExtension = idDocumentFile.name.split('.').pop();
    const idFilename = `id_${dancerId}_${Date.now()}.${idExtension}`;
    const idPath = path.join(uploadsDir, idFilename);
    const idBuffer = Buffer.from(await idDocumentFile.arrayBuffer());
    await writeFile(idPath, idBuffer);

    // Store paths relative to public directory
    const relativeSignaturePath = `/uploads/waivers/${signatureFilename}`;
    const relativeIdPath = `/uploads/waivers/${idFilename}`;

    // Create waiver record
    const result = await studioDb.createWaiver({
      dancerId,
      parentName,
      parentEmail,
      parentPhone,
      relationshipToDancer,
      signaturePath: relativeSignaturePath,
      idDocumentPath: relativeIdPath
    });

    return NextResponse.json({
      success: true,
      message: 'Waiver submitted successfully and is pending approval',
      waiverId: result.id
    });
  } catch (error) {
    console.error('Submit waiver error:', error);
    return NextResponse.json(
      { error: 'Failed to submit waiver' },
      { status: 500 }
    );
  }
}

// Get waiver information for a dancer
export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const dancerId = searchParams.get('dancerId');

    if (!dancerId) {
      return NextResponse.json(
        { error: 'Dancer ID is required' },
        { status: 400 }
      );
    }

    const waiver = await studioDb.getWaiverByDancerId(dancerId);

    return NextResponse.json({
      success: true,
      waiver: waiver
    });
  } catch (error) {
    console.error('Get waiver error:', error);
    return NextResponse.json(
      { error: 'Failed to get waiver information' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { Organisation } from '@/lib/mongoose/models/organisation.model';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongoose/connection';

// Dummy owner ID for demo purposes - in production, this should come from authentication
const DUMMY_OWNER_ID = '507f1f77bcf86cd799439011';

// Generate unique join code
async function generateUniqueJoinCode(): Promise<string> {
  let joinCode: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await Organisation.findOne({ joinCode });
    if (!existing) {
      isUnique = true;
      return joinCode;
    }
    attempts++;
  }

  // Fallback: use timestamp-based code if random generation fails
  return `ORG${Date.now().toString(36).substring(5, 11).toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all organisations but mark which ones belong to the current user
    const dummyOwnerId = new mongoose.Types.ObjectId(DUMMY_OWNER_ID);
    const organisations = await Organisation.find({})
      .sort({ createdAt: -1 });

    // Add isOwner flag to each organisation (guard in case owner is missing on some docs)
    const organisationsWithOwnership = organisations.map(org => ({
      ...org.toObject(),
      isOwner: org.owner?.toString() === dummyOwnerId.toString()
    }));

    return NextResponse.json({ success: true, data: organisationsWithOwnership });
  } catch (error: any) {
    console.error('Error fetching organisations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch organisations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/organisations - Starting request');
    await connectDB();
    console.log('Database connected successfully');

    const body = await request.json();
    console.log('Request body:', body);
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate unique join code
    const joinCode = await generateUniqueJoinCode();
    console.log('Generated join code:', joinCode);

    // Use the same consistent dummy ObjectId for demo purposes
    const dummyOwnerId = new mongoose.Types.ObjectId(DUMMY_OWNER_ID);
    
    const organisation = await Organisation.create({
      name,
      owner: dummyOwnerId,
      users: [],
      joinCode,
    });

    console.log('Organisation created successfully:', organisation._id);
    return NextResponse.json({ success: true, data: organisation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organisation:', error);
    
    // Handle duplicate key error (joinCode collision)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Join code collision. Please try again.' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create organisation' },
      { status: 500 }
    );
  }
}

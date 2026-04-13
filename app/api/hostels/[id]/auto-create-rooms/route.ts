import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose/connection';
import { RoomType } from '@/lib/mongoose/models/room-type.model';
import { RoomComponent } from '@/lib/mongoose/models/room-component.model';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const hostelId = params.id;
    const body = await request.json();
    const { roomTypes } = body;

    if (!hostelId) {
      return NextResponse.json(
        { success: false, error: 'Hostel ID is required' },
        { status: 400 }
      );
    }

    if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one room type is required' },
        { status: 400 }
      );
    }

    // Get all components for this hostel
    const components = await RoomComponent.find({ hostelId });
    
    if (components.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No components found for this hostel' },
        { status: 400 }
      );
    }

    // Get all component IDs (pre-select all)
    const allComponentIds = components.map(c => c._id) as any[];

    const createdRoomTypes = [];

    // Create room types for each selected option
    for (const roomType of roomTypes) {
      if (!roomType.selected || !roomType.price) continue;

      // Generate description using template
      const description = generateTemplateDescription(
        roomType.label,
        roomType.price,
        components.map(c => c.name)
      );

      // Check if room type already exists
      const existing = await RoomType.findOne({
        hostelId,
        name: roomType.label
      });

      if (existing) {
        // Update existing room type
        existing.description = description;
        existing.rent = parseFloat(roomType.price);
        existing.components = allComponentIds;
        await existing.save();
        await existing.populate('components', 'name description');
        createdRoomTypes.push(existing);
      } else {
        // Create new room type
        const newRoomType = await RoomType.create({
          name: roomType.label,
          description,
          components: allComponentIds,
          rent: parseFloat(roomType.price),
          hostelId,
          images: [],
        });

        await newRoomType.populate('components', 'name description');
        createdRoomTypes.push(newRoomType);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: createdRoomTypes,
      message: `${createdRoomTypes.length} room type(s) created/updated successfully`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error auto-creating rooms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create room types' },
      { status: 500 }
    );
  }
}

function generateTemplateDescription(
  roomTypeName: string,
  price: string,
  components: string[]
): string {
  const sharing = roomTypeName.toLowerCase().includes('single') ? 'private' :
                  roomTypeName.toLowerCase().includes('double') ? 'double sharing' :
                  roomTypeName.toLowerCase().includes('triple') ? 'triple sharing' :
                  'four sharing';
  
  const hasAC = roomTypeName.toLowerCase().includes('ac');
  const acText = hasAC ? 'air-conditioned' : 'well-ventilated';

  // Pick 3 key components to mention
  const keyComponents = components.slice(0, 3).join(', ');

  return `This ${acText} ${sharing} room offers comfortable accommodation at ₹${price} per month. Equipped with ${keyComponents}, and more, this room provides everything you need for a convenient stay. Perfect for students and working professionals seeking quality living space.`;
}

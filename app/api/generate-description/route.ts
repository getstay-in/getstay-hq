import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hostelName,
      city,
      roomTypes,
      amenities = [],
      safetyFeatures = [],
    } = body;

    if (!hostelName) {
      return NextResponse.json(
        { success: false, error: 'Hostel name is required' },
        { status: 400 }
      );
    }

    // Generate description using template
    const description = generateDescriptionTemplate({
      hostelName,
      city,
      roomTypes,
      amenities,
      safetyFeatures,
    });

    return NextResponse.json({ success: true, description });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate description' },
      { status: 500 }
    );
  }
}

function generateDescriptionTemplate(data: any): string {
  const {
    hostelName,
    city,
    roomTypes,
    amenities,
    safetyFeatures,
  } = data;

  // Opening paragraph with hostel introduction
  let description = `${hostelName}`;
  if (city) {
    description += ` in ${city}`;
  }
  
  description += ' is a safe and affordable accommodation option designed for students seeking a comfortable and secure stay. ';
  description += 'The hostel offers a peaceful environment with essential facilities, making it ideal for students and working professionals. ';

  // Room types and pricing
  if (roomTypes && roomTypes.length > 0) {
    const selectedRooms = roomTypes.filter((rt: any) => rt.selected && rt.price);
    if (selectedRooms.length > 0) {
      description += 'The hostel provides ';
      const roomDescriptions = selectedRooms.map((rt: any) => {
        const roomName = rt.label.toLowerCase();
        return `${roomName} at ₹${rt.price}`;
      });
      
      if (roomDescriptions.length === 1) {
        description += roomDescriptions[0];
      } else if (roomDescriptions.length === 2) {
        description += `${roomDescriptions[0]} and ${roomDescriptions[1]}`;
      } else {
        const lastRoom = roomDescriptions[roomDescriptions.length - 1];
        const otherRooms = roomDescriptions.slice(0, -1);
        description += `${otherRooms.join(', ')}, and ${lastRoom}`;
      }
      description += ' per month. ';
    }
  }

  // Amenities
  if (amenities && amenities.length > 0) {
    description += `${hostelName} is equipped with modern amenities including `;
    
    if (amenities.length === 1) {
      description += `${amenities[0]}. `;
    } else if (amenities.length === 2) {
      description += `${amenities[0]} and ${amenities[1]}. `;
    } else {
      const lastAmenity = amenities[amenities.length - 1];
      const otherAmenities = amenities.slice(0, -1);
      description += `${otherAmenities.join(', ')}, and ${lastAmenity}. `;
    }
  }

  // Safety features
  if (safetyFeatures && safetyFeatures.length > 0) {
    description += 'Safety is a top priority with ';
    
    if (safetyFeatures.length === 1) {
      description += `${safetyFeatures[0]}`;
    } else if (safetyFeatures.length === 2) {
      description += `${safetyFeatures[0]} and ${safetyFeatures[1]}`;
    } else {
      const lastFeature = safetyFeatures[safetyFeatures.length - 1];
      const otherFeatures = safetyFeatures.slice(0, -1);
      description += `${otherFeatures.join(', ')}, and ${lastFeature}`;
    }
    description += ', ensuring a secure environment for all residents.';
  }

  return description;
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const id = request.url.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request: missing id parameter' },
        { status: 400 }
      );
    }

    // Add logging to see what's happening
    console.log(`[API Route] Processing request for id: ${id}`);

    const generation = await prisma.imageGeneration.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        outputUrls: true,
        errorMessage: true,
        completedAt: true
      }
    });

    if (!generation) {
      return NextResponse.json(
        { error: 'Image generation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(generation);
  } catch (error) {
    console.error('Error fetching image generation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
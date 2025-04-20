import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationService } from '@/lib/services/imageGenerationService';
import { AuthCookieService } from '@/lib/services/authCookieService';

const imageService = new ImageGenerationService();

export async function POST(request: NextRequest) {
  try {
    const token = await AuthCookieService.getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = AuthCookieService.verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }

    const data = await request.json();
    const { prompt, size = "1024x1024" } = data;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
    }

    const userId = decodedToken.id;
    const result = await imageService.processImageGenerationRequest(userId, { prompt, size });
    
    return NextResponse.json({
      success: true,
      generationId: result.generationId,
      status: result.status
    });

  } catch (error) {
    console.error('Image generation API route error:', error);
    
    let errorMessage = 'An error occurred during image generation';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message === 'Insufficient credits') {
        statusCode = 402;
        errorMessage = error.message;
      } else {
        try {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// Remove the incorrect GET handler entirely from this static route file.
// The status checking GET request should be handled by
// /Users/admin/WebstormProjects/gpt4/src/app/api/generate-image/status/[id]/route.ts
/*
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // This signature is invalid here
) {
  try {
    const token = await AuthCookieService.getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const generation = await imageService.getGenerationStatus(params.id);
    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: generation.status,
      outputUrls: generation.outputUrls,
      errorMessage: generation.errorMessage
    });
  } catch (error) {
    console.error('Check generation status error:', error);
    return NextResponse.json(
      { error: 'Failed to check generation status' },
      { status: 500 }
    );
  }
}
*/
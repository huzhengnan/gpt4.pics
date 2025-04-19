import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationService } from '@/lib/services/imageGenerationService';
import { AuthCookieService } from '@/lib/services/authCookieService';

const imageService = new ImageGenerationService();

export async function POST(request: NextRequest) {
  try {
    // 获取并验证用户身份
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

    // 使用解码后的token中的用户ID
    const userId = decodedToken.id;

    // Correctly call the service layer method
    const result = await imageService.processImageGenerationRequest(userId, { prompt, size });
    
    // Transform the response to match frontend expectations
    return NextResponse.json({
      success: true,
      data: [{
        url: result.data.url,
        revised_prompt: result.data.revised_prompt
      }],
      created: result.created
    });

    // Service layer handles API call and DB operations
    console.log("Image generation request processed successfully by service"); 
    return NextResponse.json(result);

  } catch (error) {
    console.error('Image generation API route error:', error);
    
    let errorMessage = 'An error occurred during image generation';
    let statusCode = 500;

    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.message || errorMessage;
      } catch {
        errorMessage = error.message;
      }
      
      if (error.message === 'Insufficient credits') {
        statusCode = 402;
      }
    }

    return NextResponse.json({ 
      error: errorMessage 
    }, { status: statusCode });
  }
}
interface ApiyiImageGenerationResponse {
  data: Array<{
    url: string;
    revised_prompt: string;
  }>;
  created: number;
}

export class ApiyiService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.IMAGE_API_KEY || '';
    this.apiUrl = process.env.IMAGE_API_URL || '';
  }

  async generateImage(prompt: string, size: string = '1024x1024'): Promise<ApiyiImageGenerationResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-image",
        prompt,
        n: 1,
        size,
        quality: "standard"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'API request failed' }));
      throw new Error(String(errorData.error));
    }

    const result = await response.json();
    
    if (!result.data?.[0]?.url) {
      throw new Error('Invalid API response: No image URL found');
    }

    return result;
  }
}
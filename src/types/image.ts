export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
}

export interface ImageGenerationResponse {
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  created: number;
}
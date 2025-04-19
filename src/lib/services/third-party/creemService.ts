import axios from 'axios';

interface CreemMetadata {
  userId: string;
  orderId: string;
  planId: string;
}

export class CreemService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly productId: string;

  constructor() {
    this.apiUrl = process.env.CREEM_CHECKOUT_URL || '';
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.productId = process.env.CREEM_PRODUCT_ID || '';

    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not set in environment variables');
    }
    if (!this.productId) {
      throw new Error('CREEM_PRODUCT_ID is not set in environment variables');
    }
    if (!this.apiUrl) {
      throw new Error('CREEM_CHECKOUT_URL is not set in environment variables');
    }
  }

  async createCheckoutSession(requestId: string, metadata: CreemMetadata) {
    try {
      console.log('Creating checkout session with:', {
        requestId,
        productId: this.productId,
        metadata
      });

      const response = await axios.post(
        this.apiUrl,
        {
          request_id: requestId,
          product_id: this.productId,
          metadata
        },
        {
          headers: { 
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Creem API response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Creem API error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      console.error('Failed to create Creem checkout session:', error);
      throw new Error('Failed to create payment session');
    }
  }
} 
import axios from 'axios';
import { PaymentProductMappingRepository } from '@/lib/db/repositories/paymentProductMappingRepository';

interface CreemMetadata {
  userId: string;
  orderId: string;
  planId: string;
}

interface CreemProduct {
  id: string;
  price: number;
}

export class CreemService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly paymentProductMappingRepo: PaymentProductMappingRepository;

  constructor() {
    this.apiUrl = process.env.CREEM_CHECKOUT_URL || '';
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.paymentProductMappingRepo = new PaymentProductMappingRepository();
    
    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not set in environment variables');
    }
    if (!this.apiUrl) {
      throw new Error('CREEM_CHECKOUT_URL is not set in environment variables');
    }
  }

  public async getProductById(planId: string): Promise<CreemProduct | undefined> {
    const mapping = await this.paymentProductMappingRepo.findByPlanAndProvider(planId, 'CREEM');
    if (!mapping) return undefined;
    
    return {
      id: mapping.providerProdId,
      price: Number(mapping.pricingPlanId)
    };
  }

  async createCheckoutSession(requestId: string, productId: string, metadata: CreemMetadata) {
    try {
      const mapping = await this.paymentProductMappingRepo.findByPlanAndProvider(
        metadata.planId,
        'CREEM'
      );
      
      if (!mapping) {
        throw new Error('Payment product mapping not found');
      }

      console.log('Creating checkout session with:', {
        requestId,
        productId: mapping.providerProdId,
        metadata,
        apiKey: this.apiKey,
      });

      const response = await axios.post(
        this.apiUrl,
        {
          request_id: requestId,
          product_id: mapping.providerProdId,
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
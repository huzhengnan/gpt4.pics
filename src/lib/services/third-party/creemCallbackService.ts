import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentOrderService } from '@/lib/services/payment/paymentOrderService';
import { CreemService } from './creemService';

export interface CreemRedirectParams {
  request_id?: string | null;
  checkout_id?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  subscription_id?: string | null;
  product_id?: string | null;
  signature?: string | null;
}

export class CreemCallbackService {
  private readonly apiKey: string;
  private readonly paymentOrderService: PaymentOrderService;
  private readonly creemService: CreemService;

  constructor() {
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.paymentOrderService = new PaymentOrderService();
    this.creemService = new CreemService();
    
    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY is not set in environment variables');
    }
  }

  private generateSignature(params: Omit<CreemRedirectParams, 'signature'>): string {
    const data = Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .concat(`salt=${this.apiKey}`)
      .join('|');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public verifyCallback(params: CreemRedirectParams): boolean {
    if (!params.signature) {
      return false;
    }

    const { signature, ...otherParams } = params;
    const generatedSignature = this.generateSignature(otherParams);
    return signature === generatedSignature;
  }

  public async processCallback(params: CreemRedirectParams) {
    // 验证签名
    if (!this.verifyCallback(params)) {
      throw new Error('Invalid signature');
    }

    // 获取订单信息
    const order = await prisma.paymentOrder.findUnique({
      where: { id: params.order_id || '' },
      include: {
        plan: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.plan) {
      throw new Error('Plan not found');
    }

    // 处理支付并充值
    const result = await this.paymentOrderService.processCreemPayment(
      order.id,
      order.userId,
      order.plan.credits
    );

    return {
      checkoutId: params.checkout_id,
      orderId: params.order_id,
      customerId: params.customer_id,
      subscriptionId: params.subscription_id,
      productId: params.product_id,
      requestId: params.request_id,
      credits: order.plan.credits,
      isValid: true,
      ...result
    };
  }
}
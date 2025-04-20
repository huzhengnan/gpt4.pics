import { PaymentOrderRepository, PaymentOrderWithPlan } from '../db/repositories/paymentOrderRepository';
import { PaymentOrder, Prisma, OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  private orderRepo: PaymentOrderRepository;

  constructor() {
    this.orderRepo = new PaymentOrderRepository();
  }

  async createOrder(params: {
    userId: string;
    planId: string;
    amount: Prisma.Decimal;
    credits: number;
  }): Promise<PaymentOrder> {
    const orderNumber = `ORDER-${uuidv4()}`;
    
    return this.orderRepo.create({
      userId: params.userId,
      planId: params.planId,
      amount: params.amount,
      credits: params.credits,
      status: OrderStatus.PENDING,
      orderNumber: orderNumber,
      paymentMethod: null,
      paymentId: null
    });
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<PaymentOrder> {
    return this.orderRepo.updateStatus(orderId, status);
  }

  async findById(orderId: string): Promise<PaymentOrder | null> {
    return this.orderRepo.findById(orderId);
  }

  async findByUserId(userId: string): Promise<PaymentOrder[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async updatePaymentInfo(
    orderId: string, 
    paymentId: string, 
    status: OrderStatus = OrderStatus.COMPLETED
  ): Promise<PaymentOrderWithPlan> {
    return this.orderRepo.updateStatus(orderId, status, paymentId);
  }
}
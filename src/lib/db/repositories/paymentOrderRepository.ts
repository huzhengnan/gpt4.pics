import { OrderStatus, PaymentOrder, PricingPlan } from '@prisma/client';
import prisma from './index';

export type PaymentOrderWithPlan = PaymentOrder & {
  plan: PricingPlan | null;
};

export class PaymentOrderRepository {
  async create(data: Omit<PaymentOrder, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<PaymentOrder> {
    return prisma.paymentOrder.create({
      data
    })
  }

  async findById(id: string): Promise<PaymentOrder | null> {
    return prisma.paymentOrder.findUnique({
      where: { id }
    })
  }

  async findByOrderNumber(orderNumber: string): Promise<PaymentOrder | null> {
    return prisma.paymentOrder.findUnique({
      where: { orderNumber }
    })
  }

  async updateStatus(id: string, status: OrderStatus, paymentId?: string): Promise<PaymentOrderWithPlan> {
    return prisma.paymentOrder.update({
      where: { id },
      data: { 
        status, 
        paymentId,
        completedAt: status === OrderStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        plan: true
      }
    });
  }

  async findByUserId(userId: string): Promise<PaymentOrder[]> {
    return prisma.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
}
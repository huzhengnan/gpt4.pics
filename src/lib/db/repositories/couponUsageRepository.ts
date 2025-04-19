import prisma from './index'
import { CouponUsage } from '@prisma/client'

export class CouponUsageRepository {
  async create(data: Omit<CouponUsage, 'id' | 'createdAt'>): Promise<CouponUsage> {
    return prisma.couponUsage.create({
      data
    })
  }

  async findByCouponAndUser(couponId: string, userId: string): Promise<CouponUsage | null> {
    return prisma.couponUsage.findFirst({
      where: { couponId, userId }
    })
  }

  async findByOrderId(orderId: string): Promise<CouponUsage | null> {
    return prisma.couponUsage.findFirst({
      where: { orderId }
    })
  }
}
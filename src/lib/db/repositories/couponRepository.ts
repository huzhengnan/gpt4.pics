import prisma from './index'
import { Coupon } from '@prisma/client'

export class CouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    return prisma.coupon.findUnique({
      where: { code, isActive: true }
    })
  }

  async incrementUsage(id: string): Promise<Coupon> {
    return prisma.coupon.update({
      where: { id },
      data: { usesCount: { increment: 1 } }
    })
  }
}
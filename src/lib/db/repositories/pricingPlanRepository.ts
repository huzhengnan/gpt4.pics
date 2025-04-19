import prisma from './index'
import { PricingPlan } from '@prisma/client'

export class PricingPlanRepository {
  async findAllActive(): Promise<PricingPlan[]> {
    return prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })
  }

  async findById(id: string): Promise<PricingPlan | null> {
    return prisma.pricingPlan.findUnique({
      where: { id }
    })
  }
}
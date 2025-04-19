import { PricingPlanRepository } from '../db/repositories/pricingPlanRepository';
import { PricingPlan } from '@prisma/client';

export class PricingService {
  private pricingPlanRepo: PricingPlanRepository;

  constructor() {
    this.pricingPlanRepo = new PricingPlanRepository();
  }

  async getActivePricingPlans(): Promise<PricingPlan[]> {
    return this.pricingPlanRepo.findAllActive();
  }

  async getPricingPlanById(id: string): Promise<PricingPlan | null> {
    return this.pricingPlanRepo.findById(id);
  }
}
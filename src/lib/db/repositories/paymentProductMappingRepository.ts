import prisma from './index';
import { PaymentProductMapping, PaymentProvider, Prisma } from '@prisma/client';

export class PaymentProductMappingRepository {
  async findByPlanAndProvider(
    pricingPlanId: string,
    provider: PaymentProvider
  ): Promise<PaymentProductMapping | null> {
    return prisma.paymentProductMapping.findUnique({
      where: {
        pricingPlanId_provider: {
          pricingPlanId,
          provider
        }
      }
    });
  }

  async findByProviderProductId(
    provider: PaymentProvider,
    providerProdId: string
  ): Promise<PaymentProductMapping | null> {
    return prisma.paymentProductMapping.findFirst({
      where: {
        provider,
        providerProdId,
        isActive: true
      }
    });
  }

  async delete(id: string): Promise<PaymentProductMapping> {
    return prisma.paymentProductMapping.delete({
      where: { id }
    });
  }

  async findAll(includeInactive = false): Promise<PaymentProductMapping[]> {
    return prisma.paymentProductMapping.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        pricingPlan: true
      }
    });
  }

  async findByPricingPlanId(pricingPlanId: string): Promise<PaymentProductMapping[]> {
    return prisma.paymentProductMapping.findMany({
      where: {
        pricingPlanId,
        isActive: true
      },
      include: {
        pricingPlan: true
      }
    });
  }
}
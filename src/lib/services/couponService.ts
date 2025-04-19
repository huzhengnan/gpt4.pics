import { CouponRepository } from '../db/repositories/couponRepository';
import { CouponUsageRepository } from '../db/repositories/couponUsageRepository';
// Import Prisma separately to access Prisma.Decimal
import { Coupon, Prisma } from '@prisma/client'; // Added Prisma import

export class CouponService {
  private couponRepo: CouponRepository;
  private couponUsageRepo: CouponUsageRepository;

  constructor() {
    this.couponRepo = new CouponRepository();
    this.couponUsageRepo = new CouponUsageRepository();
  }

  async validateCoupon(code: string, userId: string, purchaseAmount: Prisma.Decimal): Promise<{ valid: boolean; coupon?: Coupon; message?: string }> { // Added Prisma.Decimal type
    const coupon = await this.couponRepo.findByCode(code);

    if (!coupon) {
      // Translate message to English
      return { valid: false, message: 'Invalid coupon code' };
    }

    if (coupon.minPurchase && purchaseAmount.lessThan(coupon.minPurchase)) {
      // Translate message to English using template literal
      return { valid: false, message: `Purchase amount does not meet the minimum requirement: ${coupon.minPurchase}` };
    }

    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      // Translate message to English
      return { valid: false, message: 'This coupon has reached its maximum usage limit' };
    }
    
    // Check if the user has already used this coupon (if needed)
    // Translate commented-out message to English
    // const usage = await this.couponUsageRepo.findByCouponAndUser(coupon.id, userId);
    // if (usage) {
    //   return { valid: false, message: 'You have already used this coupon' };
    // }

    return { valid: true, coupon };
  }

  // Can add methods like getUserAvailableCoupons, etc.
  // Translate comment to English
}
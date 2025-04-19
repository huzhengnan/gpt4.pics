import { PaymentOrderRepository } from '../db/repositories/paymentOrderRepository';
import { PricingPlanRepository } from '../db/repositories/pricingPlanRepository';
import { CouponRepository } from '../db/repositories/couponRepository';
import { CouponUsageRepository } from '../db/repositories/couponUsageRepository';
// Translate comment to English
import { CreditAccountRepository } from '../db/repositories/creditAccountRepository'; // Used to add credits after successful purchase
import { PaymentOrder, Prisma } from '@prisma/client';

export class PaymentService {
  private orderRepo: PaymentOrderRepository;
  private planRepo: PricingPlanRepository;
  private couponRepo: CouponRepository;
  private couponUsageRepo: CouponUsageRepository;
  private creditRepo: CreditAccountRepository; // Inject CreditAccountRepository

  constructor() {
    this.orderRepo = new PaymentOrderRepository();
    this.planRepo = new PricingPlanRepository();
    this.couponRepo = new CouponRepository();
    this.couponUsageRepo = new CouponUsageRepository();
    // Translate comment to English
    this.creditRepo = new CreditAccountRepository(); // Initialize
  }

  async createPaymentOrder(userId: string, planId: string, couponCode?: string): Promise<{ order: PaymentOrder, finalAmount: Prisma.Decimal }> {
    const plan = await this.planRepo.findById(planId);
    if (!plan || !plan.isActive) {
      // Translate error message to English
      throw new Error('Invalid or discontinued plan');
    }

    let finalAmount = plan.price;
    let discountAmount = new Prisma.Decimal(0);
    let couponId: string | undefined = undefined;

    // Apply coupon logic
    if (couponCode) {
      const coupon = await this.couponRepo.findByCode(couponCode);
      if (!coupon) {
        // Translate error message to English
        throw new Error('Invalid coupon code');
      }
      if (coupon.minPurchase && plan.price.lessThan(coupon.minPurchase)) {
        // Translate error message to English using template literal
        throw new Error(`Order amount does not meet the minimum coupon requirement: ${coupon.minPurchase}`);
      }
      if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
         // Translate error message to English
         throw new Error('This coupon has reached its maximum usage limit');
      }
      // Check if the user has already used this coupon (if restricted)
      // Translate commented-out message to English
      // const usage = await this.couponUsageRepo.findByCouponAndUser(coupon.id, userId);
      // if (usage) {
      //   throw new Error('You have already used this coupon');
      // }

      if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === 'percentage') {
        discountAmount = plan.price.mul(coupon.discountValue).div(100);
      }
      
      finalAmount = plan.price.sub(discountAmount);
      if (finalAmount.lessThan(0)) {
          // Translate comment to English
          finalAmount = new Prisma.Decimal(0); // Ensure amount is not negative
      }
      couponId = coupon.id;
    }

    // Translate comment to English
    const orderNumber = `ORDER-${Date.now()}-${userId.substring(0, 4)}`; // Simple order number generation

    const order = await this.orderRepo.create({
        userId,
        planId: plan.id,
        amount: finalAmount,
        credits: plan.credits,
        status: 'pending',
        orderNumber: orderNumber,
        // paymentMethod and paymentId are updated after successful payment
        paymentMethod: null,
        paymentId: null
    });

    // If a coupon was used, record the usage
    if (couponId) {
      await this.couponUsageRepo.create({
        couponId: couponId,
        userId: userId,
        orderId: order.id,
        discountAmount: discountAmount
      });
      // Update coupon usage count
      await this.couponRepo.incrementUsage(couponId);
    }

    return { order, finalAmount };
  }

  async completePayment(orderId: string, paymentId: string, paymentMethod: string): Promise<PaymentOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.status !== 'pending') {
      // Translate error message to English
      throw new Error('Invalid order or incorrect order status');
    }

    // Call CreditAccountRepository to add credits
    // Translate description string to English using template literal
    await this.creditRepo.addCredits(order.userId, order.credits, 'purchase', `Purchase plan: ${order.planId}`, order.id);

    // Update order status
    return this.orderRepo.updateStatus(orderId, 'completed', paymentId);
  }

  async failPayment(orderId: string): Promise<PaymentOrder> {
    return this.orderRepo.updateStatus(orderId, 'failed');
  }

  async getUserOrders(userId: string): Promise<PaymentOrder[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async getOrderById(orderId: string): Promise<PaymentOrder | null> {
    return this.orderRepo.findById(orderId);
  }
}
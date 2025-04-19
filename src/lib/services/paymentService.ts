import { PaymentOrderRepository } from '../db/repositories/paymentOrderRepository';
import { PricingPlanRepository } from '../db/repositories/pricingPlanRepository';
import { CouponRepository } from '../db/repositories/couponRepository';
import { CouponUsageRepository } from '../db/repositories/couponUsageRepository';
// Translate comment to English
import { CreditAccountRepository } from '../db/repositories/creditAccountRepository'; // Used to add credits after successful purchase
import { PaymentOrder, Prisma, OrderStatus, CreditTransactionType, CouponDiscountType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreemService } from './third-party/creemService';

const prisma = new PrismaClient();

export class PaymentService {
  private orderRepo: PaymentOrderRepository;
  private planRepo: PricingPlanRepository;
  private couponRepo: CouponRepository;
  private couponUsageRepo: CouponUsageRepository;
  private creditRepo: CreditAccountRepository; // Inject CreditAccountRepository
  private creemService: CreemService;

  constructor() {
    this.orderRepo = new PaymentOrderRepository();
    this.planRepo = new PricingPlanRepository();
    this.couponRepo = new CouponRepository();
    this.couponUsageRepo = new CouponUsageRepository();
    // Translate comment to English
    this.creditRepo = new CreditAccountRepository(); // Initialize
    this.creemService = new CreemService();
  }

  async createPaymentOrder(userId: string, planId: string, couponCode?: string): Promise<{ order: PaymentOrder, finalAmount: Prisma.Decimal, paymentUrl: string }> {
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

      if (coupon.discountType === CouponDiscountType.FIXED_AMOUNT) {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
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
    const orderNumber = `ORDER-${uuidv4()}`;

    const order = await this.orderRepo.create({
        userId,
        planId: plan.id,
        amount: finalAmount,
        credits: plan.credits,
        status: OrderStatus.PENDING,
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

    // 使用 CreemService 创建支付链接
    const checkoutSession = await this.creemService.createCheckoutSession(order.id, {
      userId,
      orderId: order.id,
      planId: plan.id
    });

    return { 
      order, 
      finalAmount, 
      paymentUrl: checkoutSession.checkout_url 
    };
  }

  async handlePaymentSuccess(orderId: string, paymentId: string) {
    const order = await prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        paymentId,
        completedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    if (!order.plan) {
      throw new Error('Plan not found for order');
    }

    // 更新用户信用账户
    const creditAccount = await prisma.creditAccount.upsert({
      where: { userId: order.userId },
      create: {
        userId: order.userId,
        balance: order.plan.credits,
        totalEarned: order.plan.credits,
      },
      update: {
        balance: {
          increment: order.plan.credits,
        },
        totalEarned: {
          increment: order.plan.credits,
        },
      },
    });

    // 创建信用交易记录
    await prisma.creditTransaction.create({
      data: {
        userId: order.userId,
        amount: order.plan.credits,
        type: CreditTransactionType.PURCHASE,
        description: `Purchase of ${order.plan.name} plan`,
        referenceId: order.id,
        balanceAfter: creditAccount.balance + order.plan.credits,
      },
    });

    return order;
  }

  async handlePaymentFailure(orderId: string) {
    return this.orderRepo.updateStatus(orderId, OrderStatus.FAILED);
  }

  async getUserOrders(userId: string): Promise<PaymentOrder[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async getOrderById(orderId: string): Promise<PaymentOrder | null> {
    return this.orderRepo.findById(orderId);
  }
}
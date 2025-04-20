import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export class PaymentOrderService {
  async processCreemPayment(orderId: string, userId: string, credits: number) {
    // 开始事务
    return await prisma.$transaction(async (tx) => {
      // 1. 更新订单状态
      const order = await tx.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          user: {
            include: {
              creditAccount: true,
            },
          },
        },
      });

      if (!order.user.creditAccount) {
        throw new Error('User credit account not found');
      }

      // 2. 更新用户积分账户
      const creditAccount = await tx.creditAccount.update({
        where: { id: order.user.creditAccount.id },
        data: {
          balance: {
            increment: credits,
          },
          totalEarned: {
            increment: credits,
          },
        },
      });

      // 3. 创建积分交易记录
      await tx.creditTransaction.create({
        data: {
          userId: userId,
          amount: credits,
          balanceAfter: creditAccount.balance,
          type: 'PURCHASE',
          description: `Payment order: ${orderId}`,
          referenceId: orderId,
        },
      });

      return {
        order,
        creditAccount,
      };
    });
  }
} 
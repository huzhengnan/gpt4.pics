import PricingClientPage from './PricingClientPage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function PricingPage() {
  // 获取所有激活的付款计划
  const plans = await prisma.pricingPlan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      price: 'asc',
    },
  });

  // 如果没有计划，创建默认计划
  if (plans.length === 0) {
    const defaultPlans = [
      {
        name: 'Starter Pack',
        credits: 100,
        price: 9.99,
        isPopular: false,
        isActive: true,
        description: 'Perfect for trying out our service',
      },
      {
        name: 'Pro Pack',
        credits: 500,
        price: 39.99,
        isPopular: true,
        isActive: true,
        description: 'Best value for regular users',
      },
      {
        name: 'Enterprise Pack',
        credits: 2000,
        price: 149.99,
        isPopular: false,
        isActive: true,
        description: 'For power users and businesses',
      },
    ];

    // 创建默认计划
    await Promise.all(
      defaultPlans.map((plan) =>
        prisma.pricingPlan.create({
          data: plan,
        })
      )
    );

    // 重新获取计划
    const updatedPlans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    // 将价格转换为字符串
    const serializedUpdatedPlans = updatedPlans.map(plan => ({
      ...plan,
      price: plan.price.toString(),
    }));

    return <PricingClientPage plans={serializedUpdatedPlans} />;
  }

  // 将价格转换为字符串
  const serializedPlans = plans.map(plan => ({
    ...plan,
    price: plan.price.toString(),
  }));

  return <PricingClientPage plans={serializedPlans} />;
}

// 添加元数据（可选）
export const metadata = {
  title: 'Pricing Plans - GPT4.PICS',
  description: 'Choose a credit plan that suits your needs.',
};
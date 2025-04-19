import { NextResponse } from 'next/server';
import { PricingService } from '@/lib/services/pricingService';

// 处理 GET 请求以获取所有激活的价格套餐
export async function GET() {
  try {
    const pricingService = new PricingService();
    const plans = await pricingService.getActivePricingPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to fetch pricing plans:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch pricing plans', details: errorMessage }, { status: 500 });
  }
}
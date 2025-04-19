import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';
import { UserService } from '@/lib/services/userService';

export async function POST(request: NextRequest) {
  try {
    // 从请求头中获取用户 ID
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userService = new UserService();
    const user = await userService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const paymentService = new PaymentService();
    const result = await paymentService.createPaymentOrder(user.id, planId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
} 
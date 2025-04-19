import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, payment_id, status } = body;

    if (!order_id || !payment_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const paymentService = new PaymentService();

    if (status === 'completed') {
      await paymentService.handlePaymentSuccess(order_id, payment_id);
    } else if (status === 'failed') {
      await paymentService.handlePaymentFailure(order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to handle payment webhook:', error);
    return NextResponse.json(
      { error: 'Failed to handle payment webhook' },
      { status: 500 }
    );
  }
} 
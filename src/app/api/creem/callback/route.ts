import { NextResponse } from 'next/server';
import { CreemCallbackService, CreemRedirectParams } from '@/lib/services/third-party/creemCallbackService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params: CreemRedirectParams = {
      request_id: url.searchParams.get('request_id'),
      checkout_id: url.searchParams.get('checkout_id'),
      order_id: url.searchParams.get('order_id'),
      customer_id: url.searchParams.get('customer_id'),
      subscription_id: url.searchParams.get('subscription_id'),
      product_id: url.searchParams.get('product_id'),
      signature: url.searchParams.get('signature')
    };

    const callbackService = new CreemCallbackService();
    await callbackService.processCallback(params);

    // 重定向到成功页面
    return NextResponse.redirect(new URL('/payment/success', request.url));
  } catch (error) {
    console.error('Creem callback error:', error);
    // 重定向到失败页面
    return NextResponse.redirect(new URL('/payment/failed', request.url));
  }
} 
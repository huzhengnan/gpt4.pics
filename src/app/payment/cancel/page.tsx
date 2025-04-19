'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // 显示取消消息
    alert('Payment was cancelled. You can try again later.');
    // 重定向到定价页面
    router.push('/pricing');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Cancelled</h1>
      <p className="text-gray-600 dark:text-gray-400">Redirecting you to the pricing page...</p>
    </div>
  );
} 
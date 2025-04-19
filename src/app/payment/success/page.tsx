'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 显示成功消息
    alert('Payment successful! Your credits have been added to your account.');
    // 重定向到主页
    router.push('/');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Successful</h1>
      <p className="text-gray-600 dark:text-gray-400">Redirecting you to the home page...</p>
    </div>
  );
} 
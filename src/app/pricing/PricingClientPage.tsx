'use client';

import { useState } from 'react';
import type { PricingPlan } from '@prisma/client';
import { useAuth } from '@/contexts/AuthContext'; // 用于检查登录状态
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // 使用 Heroicons v2

// 定义一个接口，继承自 PricingPlan，但将 price 字段改为字符串类型
interface SerializedPricingPlan extends Omit<PricingPlan, 'price'> {
  price: string;
}

interface PricingClientPageProps {
  plans: SerializedPricingPlan[];
}

export default function PricingClientPage({ plans }: PricingClientPageProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null); //跟踪哪个计划正在加载
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const handleChoosePlan = async (planId: string) => {
    if (!isAuthenticated) {
      // 如果未登录，重定向到登录页面，并带上回调地址
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }

    setIsLoading(planId);
    setError(null);

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user!.id,
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();
      window.location.href = data.paymentUrl; // 使用 window.location 进行重定向，因为这是外部 URL

    } catch (err) {
      console.error('Failed to initiate payment:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(null);
    }
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pricing Plans</h1>
        <p className="text-gray-600 dark:text-gray-400">No pricing plans available at the moment. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
          Find the Perfect Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose a credit package that fits your creative needs and budget. Get started generating amazing images today!
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 text-center text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/30 rounded-lg">
           Error: {error}
        </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border ${
              plan.isPopular
                ? 'border-indigo-500 dark:border-indigo-600 shadow-2xl'
                : 'border-gray-200 dark:border-gray-700 shadow-lg'
            } bg-white dark:bg-gray-800 p-8 transition-all duration-300 hover:shadow-xl`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 -mt-3 mr-3">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  Most Popular
                </span>
              </div>
            )}

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{plan.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 flex-grow">{plan.description}</p>

            <div className="mb-8">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">${plan.price}</span>
              {/* 可以添加 /month 或其他周期信息 */}
            </div>

            <ul role="list" className="space-y-4 mb-8">
              <li className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700 dark:text-gray-300">{plan.credits} Credits</span>
              </li>
              {/* 可以添加更多特性列表 */}
               <li className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700 dark:text-gray-300">Standard Image Generation</span>
              </li>
               <li className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700 dark:text-gray-300">Community Support</span>
              </li>
            </ul>

            <button
               onClick={() => handleChoosePlan(plan.id)}
               disabled={isLoading === plan.id}
               className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 ${
                 isLoading === plan.id
                   ? 'bg-gray-400 cursor-not-allowed'
                   : plan.isPopular
                   ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                   : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900'
               }`}
             >
               {isLoading === plan.id ? 'Processing...' : 'Choose Plan'}
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';

import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text inline-block">
            AI Image Generator
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create stunning AI-generated images with our advanced image generation technology
          </p>
        </div>

        <ImageGenerator />
      </div>
    </main>
  );
}

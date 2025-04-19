'use client';

// 1. Import useAuth
import { useAuth } from '@/contexts/AuthContext'; // Import the hook
import Image from 'next/image';
import { useRef, useState } from 'react';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{prompt: string, imageUrl: string}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 2. Get refreshUser from useAuth
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check specifically for insufficient credits error message from backend
        if (data.error && data.error.toLowerCase().includes('insufficient credits')) {
           setError('Insufficient credits to generate image.');
        } else {
           throw new Error(data.error || 'Failed to generate image');
        }
        // Do not proceed further if response is not ok
        return; 
      }


      if (data.data?.[0]?.url) {
        const newImageUrl = data.data[0].url;
        setImageUrl(newImageUrl);
        setHistory(prev => [...prev, { prompt, imageUrl: newImageUrl }]);
        
        // 3. Refresh user data (including balance) after successful generation
        try {
          await refreshUser(); 
        } catch (refreshError) {
           // Optionally handle refresh errors, though AuthContext might handle its own errors
           console.error("Failed to refresh user balance after generation:", refreshError);
           // You might want to show a subtle notification here instead of a blocking error
        }

      } else {
        throw new Error('No image data returned');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      // Avoid setting error if already set (e.g., insufficient credits)
      if (!error) { 
         setError(err instanceof Error ? err.message : 'Error during image generation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                Create Your Image
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe your image in detail
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="prompt"
                    value={prompt}
                    onChange={handleTextareaChange}
                    placeholder="A serene Japanese garden with cherry blossoms, a small wooden bridge over a koi pond, and traditional lanterns casting a warm glow..."
                    rows={4}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors duration-200"
                  />
                </div>
                
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Choose Image Size
                  </label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  >
                    <option value="1024x1024">Square (1024×1024)</option>
                    <option value="1024x1792">Portrait (1024×1792)</option>
                    <option value="1792x1024">Landscape (1792×1024)</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating Magic...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V8.5M13.5 3L19 8.5M13.5 3V7.5C13.5 8.05228 13.9477 8.5 14.5 8.5H19"/>
                      </svg>
                      Generate Image
                    </div>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-xl">
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
                Generation History
              </h2>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">Your creation history will appear here</p>
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <div className="w-20 h-20 relative flex-shrink-0">
                        <Image 
                          src={item.imageUrl} 
                          alt={`Generated image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{item.prompt}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 h-full">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
                Preview
              </h2>
              
              {imageUrl ? (
                <div className="space-y-6">
                  <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
                    <Image 
                      src={imageUrl} 
                      alt="Generated image" 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Download Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading ? 'Creating your masterpiece...' : 'Your generated image will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
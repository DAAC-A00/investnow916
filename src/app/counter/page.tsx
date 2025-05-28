/**
 * Counter 페이지 컴포넌트
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useNavigationActions } from '../../packages/shared/stores/createNavigationStore';

export default function CounterPage() {
  const [count, setCount] = useState(0);
  const { setCurrentRoute } = useNavigationActions();

  useEffect(() => {
    setCurrentRoute('/counter');
  }, [setCurrentRoute]);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔢 Counter
          </h1>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {count}
            </div>
            <p className="text-gray-500">현재 카운트</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={decrement}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                -1
              </button>
              <button
                onClick={increment}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                +1
              </button>
            </div>
            
            <button
              onClick={reset}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              초기화
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            버튼을 클릭하여 카운터를 조작해보세요
          </div>
        </div>
      </div>
    </div>
  );
}

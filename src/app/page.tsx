/**
 * 홈 페이지 컴포넌트
 */

'use client';

import React, { useEffect } from 'react';
import { useNavigationActions } from '../packages/shared/stores/createNavigationStore';

export default function Home() {
  const { setCurrentRoute } = useNavigationActions();

  useEffect(() => {
    setCurrentRoute('/');
  }, [setCurrentRoute]);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.location.href = route;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              InvestNow916
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            실시간 금융 데이터와 투자 분석을 위한 통합 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigate('/counter')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🔢 Counter 체험하기
            </button>
            <button
              onClick={() => handleNavigate('/menu')}
              className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-lg border border-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ☰ 전체 메뉴 보기
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">반응형 디자인</h3>
            <p className="text-gray-600">
              모바일과 데스크톱 모두에서 최적화된 사용자 경험을 제공합니다
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">실시간 데이터</h3>
            <p className="text-gray-600">
              WebSocket을 통한 실시간 금융 데이터 스트리밍 지원
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Monorepo 구조</h3>
            <p className="text-gray-600">
              웹과 모바일 앱 간 코드 공유를 통한 효율적인 개발
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">기술 스택</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-2xl mb-2">⚛️</div>
              <div className="font-medium">React</div>
              <div className="text-sm text-gray-500">Next.js</div>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-medium">React Native</div>
              <div className="text-sm text-gray-500">Expo</div>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-medium">Tailwind CSS</div>
              <div className="text-sm text-gray-500">Tamagui</div>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">🐻</div>
              <div className="font-medium">Zustand</div>
              <div className="text-sm text-gray-500">상태 관리</div>
            </div>
          </div>
        </div>

        {/* Navigation Hint */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">💡 네비게이션 팁</h3>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">모바일:</span> 하단 네비게이션 바를 사용하세요<br />
              <span className="font-medium">데스크톱:</span> 우측 상단의 메뉴 버튼을 클릭하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

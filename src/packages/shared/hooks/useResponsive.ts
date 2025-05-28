/**
 * 반응형 상태를 감지하는 훅
 * 태블릿(768px 이상)은 데스크톱으로 분류
 */

'use client';

import { useState, useEffect } from 'react';
import { useNavigationActions } from '../stores/createNavigationStore';

export type DeviceType = 'mobile' | 'desktop';

export interface ResponsiveState {
  isMobile: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  screenWidth: number;
  isHydrated: boolean;
}

export function useResponsive(): ResponsiveState {
  const [screenWidth, setScreenWidth] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const { setDeviceType } = useNavigationActions();

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    // 초기값 설정
    updateScreenWidth();
    setIsHydrated(true);

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', updateScreenWidth);

    return () => {
      window.removeEventListener('resize', updateScreenWidth);
    };
  }, []);

  // 태블릿(768px 이상)을 데스크톱으로 분류
  // 하이드레이션 전에는 모바일로 가정 (SSR 호환성)
  const isMobile = !isHydrated || (screenWidth > 0 && screenWidth < 768);
  const isDesktop = isHydrated && screenWidth >= 768;
  const deviceType: DeviceType = isMobile ? 'mobile' : 'desktop';

  // Zustand 스토어에 디바이스 타입 동기화
  useEffect(() => {
    if (isHydrated && screenWidth > 0) {
      setDeviceType(deviceType);
    }
  }, [deviceType, setDeviceType, screenWidth, isHydrated]);

  return {
    isMobile,
    isDesktop,
    deviceType,
    screenWidth,
    isHydrated,
  };
}

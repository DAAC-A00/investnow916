'use client';

import { useEffect, useState } from 'react';
import { useAdminModeStore } from '../stores/createAdminModeStore';
import { useNavigationActions, useMenuItems } from '../stores/createNavigationStore';
import type { MenuItemType } from '../types/navigation';

/**
 * 관리자 모드 초기화 컴포넌트
 * 
 * 앱 시작 시 관리자 모드 상태를 로컬 스토리지에서 복원합니다.
 * 하이드레이션 불일치를 방지하기 위해 클라이언트 사이드에서만 실행됩니다.
 * 관리자 모드 상태에 따라 환율 정보 메뉴의 활성화 상태를 업데이트합니다.
 */
export function AdminModeInitializer() {
  const [isMounted, setIsMounted] = useState(false);
  const store = useAdminModeStore();
  const { updateMenuItem } = useNavigationActions();
  const menuItems = useMenuItems();

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 관리자 모드 상태 변경 시 추가 작업이 필요한 경우 여기에 추가
  useEffect(() => {
    if (isMounted) {
      // 디버깅 정보 (개발 환경에서만 표시)
      if (process.env.NODE_ENV === 'development') {
        console.log('[AdminModeInitializer] 관리자 모드 상태:', store.isEnabled ? '활성화' : '비활성화');
      }
    }
  }, [isMounted, store.isEnabled]);

  // 디버깅 정보 (개발 환경에서만 표시)
  if (process.env.NODE_ENV === 'development' && isMounted) {
    console.log('[AdminModeInitializer] 관리자 모드 상태:', store.isEnabled ? '활성화' : '비활성화');
  }

  // 렌더링 없음 (상태 초기화만 수행)
  return null;
}

export default AdminModeInitializer;

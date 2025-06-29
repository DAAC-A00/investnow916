/**
 * 네비게이션 관련 공통 타입 정의
 */

export interface MenuItemType {
  id: string;
  label: string;          // 메뉴 표시명
  title?: string;         // 선택적 제목 (기존 호환성)
  description?: string;
  icon?: string;
  route: string;
  isActive?: boolean;
  isOnlySearchable?: boolean; // 검색에만 표시되고 메뉴에는 표시되지 않는지 여부
  isAdminOnly: boolean;  // 관리자 모드에서만 표시할지 여부
  isRightNav?: boolean;  // 우측 네비게이션에 표시할지 여부 (기본값: false)
  rightNavOrder?: number; // 우측 네비게이션에서의 표시 순서 (isRightNav가 true일 때만 사용)
  children?: MenuItemType[]; // 서브메뉴 아이템들
}

export interface NavigationState {
  currentRoute: string;
  menuItems: MenuItemType[];
  isMenuOpen: boolean;
  isMobile: boolean;
}

export type NavigationAction = 
  | { type: 'SET_CURRENT_ROUTE'; payload: string }
  | { type: 'TOGGLE_MENU' }
  | { type: 'SET_MENU_OPEN'; payload: boolean }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItemType }
  | { type: 'UPDATE_MENU_ITEM'; payload: { id: string; updates: Partial<MenuItemType> } };

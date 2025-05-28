/**
 * 네비게이션 상태 관리 스토어 (Zustand + Immer)
 */

import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MenuItemType, NavigationState } from '../types/navigation';

// 디바이스 타입 정의
export type DeviceType = 'mobile' | 'desktop';

// 확장된 네비게이션 상태 인터페이스
interface ExtendedNavigationState extends NavigationState {
  deviceType: DeviceType;
}

// 네비게이션 액션 인터페이스
interface NavigationActions {
  setCurrentRoute: (route: string) => void;
  toggleMenu: () => void;
  setMenuOpen: (isOpen: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setDeviceType: (deviceType: DeviceType) => void;
  addMenuItem: (item: MenuItemType) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItemType>) => void;
  initializeDefaultMenus: () => void;
}

// 전체 스토어 타입
type NavigationStore = ExtendedNavigationState & NavigationActions;

// 기본 메뉴 아이템들
const defaultMenuItems: MenuItemType[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    route: '/',
    description: 'InvestNow916 메인 페이지',
    isDisabled: false,
  },
  {
    id: 'counter',
    label: 'Counter',
    icon: '🔢',
    route: '/counter',
    description: '숫자 카운터 기능',
    isDisabled: false,
  },
  {
    id: 'menu',
    label: '전체 메뉴',
    icon: '☰',
    route: '/menu',
    description: '모든 기능 목록 보기',
    isDisabled: false,
  },
];

// Zustand 스토어 생성자
const navigationStoreCreator: StateCreator<
  NavigationStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  NavigationStore
> = (set, get) => ({
  // 초기 상태
  currentRoute: '/',
  isMenuOpen: false,
  isMobile: false,
  deviceType: 'desktop',
  menuItems: [],

  // 액션들
  setCurrentRoute: (route: string) =>
    set(
      (state) => {
        console.log('🔄 경로 변경:', state.currentRoute, '->', route);
        state.currentRoute = route;
      },
      false,
      'setCurrentRoute'
    ),

  toggleMenu: () =>
    set(
      (state) => {
        state.isMenuOpen = !state.isMenuOpen;
      },
      false,
      'toggleMenu'
    ),

  setMenuOpen: (isOpen: boolean) =>
    set(
      (state) => {
        state.isMenuOpen = isOpen;
      },
      false,
      'setMenuOpen'
    ),

  setIsMobile: (isMobile: boolean) =>
    set(
      (state) => {
        state.isMobile = isMobile;
      },
      false,
      'setIsMobile'
    ),

  setDeviceType: (deviceType: DeviceType) =>
    set(
      (state) => {
        state.deviceType = deviceType;
        state.isMobile = deviceType === 'mobile';
      },
      false,
      'setDeviceType'
    ),

  addMenuItem: (item: MenuItemType) =>
    set(
      (state) => {
        state.menuItems.push(item);
      },
      false,
      'addMenuItem'
    ),

  updateMenuItem: (id: string, updates: Partial<MenuItemType>) =>
    set(
      (state) => {
        const index = state.menuItems.findIndex((item) => item.id === id);
        if (index !== -1) {
          Object.assign(state.menuItems[index], updates);
        }
      },
      false,
      'updateMenuItem'
    ),

  initializeDefaultMenus: () =>
    set(
      (state) => {
        if (state.menuItems.length === 0) {
          state.menuItems = defaultMenuItems;
        }
      },
      false,
      'initializeDefaultMenus'
    ),
});

// 스토어 생성
export const useNavigationStore = create<NavigationStore>()(
  devtools(
    immer(navigationStoreCreator),
    {
      name: 'navigation-store',
    }
  )
);

// 선택자 훅들
export const useCurrentRoute = () => useNavigationStore((state) => state.currentRoute);
export const useIsMenuOpen = () => useNavigationStore((state) => state.isMenuOpen);
export const useIsMobile = () => useNavigationStore((state) => state.isMobile);
export const useDeviceType = () => useNavigationStore((state) => state.deviceType);
export const useMenuItems = () => useNavigationStore((state) => state.menuItems);

// 액션 훅
export const useNavigationActions = () => useNavigationStore((state) => ({
  setCurrentRoute: state.setCurrentRoute,
  toggleMenu: state.toggleMenu,
  setMenuOpen: state.setMenuOpen,
  setIsMobile: state.setIsMobile,
  setDeviceType: state.setDeviceType,
  addMenuItem: state.addMenuItem,
  updateMenuItem: state.updateMenuItem,
  initializeDefaultMenus: state.initializeDefaultMenus,
}));

/**
 * 네비게이션 상태 관리 스토어 (Zustand + Immer)
 */

import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MenuItemType, NavigationState } from '../types/navigation';

// 메뉴 아이템 타입에 children 속성 추가
declare module '../types/navigation' {
  interface MenuItemType {
    children?: MenuItemType[];
  }
}

// 디바이스 타입 정의
export type DeviceType = 'mobile' | 'desktop';

// 확장된 네비게이션 상태 인터페이스
interface ExtendedNavigationState extends NavigationState {
  deviceType: DeviceType;
  rightNavWidth: number; // 오른쪽 네비게이션 너비 (tailwind 클래스 숫자 값)
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
  setRightNavWidth: (width: number) => void; // 오른쪽 네비게이션 너비 설정 액션
}

// 전체 스토어 타입
type NavigationStore = ExtendedNavigationState & NavigationActions;

// 기본 메뉴 아이템들
//     label은 1~3글자로 제한
const defaultMenuItems: MenuItemType[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    route: '/',
    description: '홈 화면으로 이동',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 1,
  },
  {
    id: 'exchange',
    label: '환율',
    icon: '💱',
    route: '/fiat',
    description: '실시간 환율 정보 조회',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 2,
  },
  {
    id: 'exchange-ticker',
    label: '통합시세',
    icon: '�',
    route: '/exchange/ticker',
    description: '실시간 통합시세 정보 조회',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 7,
  },
  {
    id: 'exchange-bybit',
    label: 'Bybit',
    icon: '🏢',
    route: '/exchange/ticker/bybit',
    description: '바이빗 거래소 코인 정보 조회',
    isAdminOnly: false,
    isRightNav: false,
  },
  {
    id: 'exchange-bithumb',
    label: 'Bithumb',
    icon: '🏢',
    route: '/exchange/ticker/bithumb',
    description: '빗썸 거래소 코인 정보 조회',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 3,
  },
  {
    id: 'exchange-bybit-instrument',
    label: '계측',
    icon: '🛠️',
    route: '/exchange/instrument/bybit',
    description: 'Bybit Instrument 정보 조회',
    isAdminOnly: false,
    isRightNav: false, // 우측 네비게이션에 표시하지 않음
  },
  {
    id: 'exchange-bithumb-instrument',
    label: '계측',
    icon: '🛠️',
    route: '/exchange/instrument/bithumb',
    description: '빗썸 Instrument 정보 조회',
    isAdminOnly: false,
    isRightNav: false, // 우측 네비게이션에 표시하지 않음
  },
  {
    id: 'exchange-binance-instrument',
    label: '바낸',
    icon: '🛠️',
    route: '/exchange/instrument/binance',
    description: '바이낸스 Instrument 정보 조회',
    isAdminOnly: false,
    isRightNav: true, // 우측 네비게이션에 표시
  },
  {
    id: 'storage',
    label: '저장소',
    icon: '📂️',
    route: '/admin/storage',
    description: 'Local Storage 데이터 관리 (관리자 전용)',
    isAdminOnly: true,
    isRightNav: true,
    rightNavOrder: 4,
  },
  {
    id: 'setting',
    label: '설정',
    icon: '⚙️',
    route: '/setting',
    description: '앱 설정 관리',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 5,
  },
  {
    id: 'setting-ticker',
    label: '티커 설정',
    icon: '📊',
    route: '/setting/ticker',
    description: 'Ticker 설정 관리',
    isAdminOnly: false,
    isRightNav: true,
    rightNavOrder: 6,
  },
  {
    id: 'api-key',
    label: 'API 키 설정',
    icon: '🔑',
    route: '/setting/apikey',
    description: 'ExchangeRate-API 키 관리',
    isAdminOnly: false,
    isRightNav: false, // 우측 네비게이션에 표시하지 않음
  },
  {
    id: 'admin-design',
    label: '디자인',
    icon: '🎨',
    route: '/admin/design',
    description: '기본 디자인 확인',
    isAdminOnly: true,
    isRightNav: false, // 우측 네비게이션에 표시하지 않음
  },
  {
    id: 'menu',
    label: '메뉴',
    icon: '☰',
    route: '/menu',
    description: '모든 메뉴 목록 보기',
    isAdminOnly: false,
    isRightNav: false, // 우측 네비게이션에 표시하지 않음
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
  // 오른쪽 네비게이션 기본 너비를 20으로 고정
  rightNavWidth: 20,

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
    
  // 오른쪽 네비게이션 너비 설정
  setRightNavWidth: (width: number) =>
    set(
      (state) => {
        state.rightNavWidth = width;
      },
      false,
      'setRightNavWidth'
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
export const useRightNavWidth = () => useNavigationStore((state) => state.rightNavWidth);

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
  setRightNavWidth: state.setRightNavWidth,
}));

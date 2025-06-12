/**
 * Bybit 카테고리 관리 상수 및 유틸리티 함수
 * Raw 카테고리와 Display 카테고리 간의 변환을 중앙에서 관리
 */

// Bybit Raw 카테고리 (API 요청용)
export type BybitRawCategory = 'linear' | 'inverse' | 'spot' | 'option';

// Bybit Display 카테고리 (내부 표시용)
export type BybitDisplayCategory = 'um' | 'cm' | 'spot' | 'option';

// Raw 카테고리에서 Display 카테고리로의 매핑
export const BYBIT_CATEGORY_MAPPING = {
  // API 요청용 카테고리(rawCategory): 표시용 카테고리(displayCategory)
  linear: 'um',
  inverse: 'cm',
  spot: 'spot',
  option: 'option'
} as const;

// Raw 카테고리에서 Display 카테고리로 변환
export const toDisplayCategory = (rawCategory: BybitRawCategory): BybitDisplayCategory => {
  return BYBIT_CATEGORY_MAPPING[rawCategory];
};

// Display 카테고리에서 Raw 카테고리로 변환
export const toRawCategory = (displayCategory: BybitDisplayCategory): BybitRawCategory => {
  const entry = Object.entries(BYBIT_CATEGORY_MAPPING).find(
    ([_, value]) => value === displayCategory
  );
  return (entry?.[0] || displayCategory) as BybitRawCategory;
};

// 모든 Raw 카테고리 목록
export const ALL_RAW_CATEGORIES: BybitRawCategory[] = ['linear', 'inverse', 'spot', 'option'];

// 모든 Display 카테고리 목록
export const ALL_DISPLAY_CATEGORIES: BybitDisplayCategory[] = ['um', 'cm', 'spot', 'option'];

// 카테고리 유효성 검사
export const isValidRawCategory = (category: string): category is BybitRawCategory => {
  return ALL_RAW_CATEGORIES.includes(category as BybitRawCategory);
};

export const isValidDisplayCategory = (category: string): category is BybitDisplayCategory => {
  return ALL_DISPLAY_CATEGORIES.includes(category as BybitDisplayCategory);
};

// 카테고리 라벨 매핑 (UI 표시용)
export const BYBIT_CATEGORY_LABELS = {
  linear: 'USDT 무기한 선물 (UM)',
  inverse: '코인 마진 선물 (CM)',
  spot: '현물 거래',
  option: '옵션 거래'
} as const;

// Raw 카테고리의 한국어 라벨 가져오기
export const getRawCategoryLabel = (rawCategory: BybitRawCategory): string => {
  return BYBIT_CATEGORY_LABELS[rawCategory];
};

// Display 카테고리의 한국어 라벨 가져오기
export const getDisplayCategoryLabel = (displayCategory: BybitDisplayCategory): string => {
  const rawCategory = toRawCategory(displayCategory);
  return BYBIT_CATEGORY_LABELS[rawCategory];
};
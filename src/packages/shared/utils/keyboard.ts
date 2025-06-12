// 한글 유니코드 범위
const HANGUL_START = 0xAC00; // '가'
const HANGUL_END = 0xD7A3;   // '힣'

// 초성 (19개)
const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 중성 (21개)
const MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
// 종성 (28개, 공백 포함)
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 자음/모음 QWERTY 키보드 매핑
export const KOR_TO_ENG: { [key: string]: string } = {
  // 자음
  'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E',
  'ㄹ': 'f', 'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't',
  'ㅆ': 'T', 'ㅇ': 'd', 'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
  // 모음
  'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j',
  'ㅔ': 'p', 'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk',
  'ㅙ': 'ho', 'ㅚ': 'hl', 'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj',
  'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b', 'ㅡ': 'm', 'ㅢ': 'ml',
  'ㅣ': 'l', ' ': ' ',
  // 쌍자음
  'ㄳ': 'rt', 'ㄵ': 'sw', 'ㄶ': 'sg', 'ㄺ': 'fr', 'ㄻ': 'fa',
  'ㄼ': 'fq', 'ㄽ': 'ft', 'ㄾ': 'fx', 'ㄿ': 'fv', 'ㅀ': 'fg',
  'ㅄ': 'qt'
};

/**
 * 한글 음절을 초성, 중성, 종성으로 분해합니다.
 * @param char 한글 음절 1개
 * @returns [초성, 중성, 종성] 배열
 */
const decomposeHangul = (char: string): [string, string, string] => {
  const code = char.charCodeAt(0);
  
  // 한글이 아닌 경우
  if (code < HANGUL_START || code > HANGUL_END) {
    return ['', '', ''];
  }
  
  const index = code - HANGUL_START;
  const initialIndex = Math.floor(index / (21 * 28));
  const medialIndex = Math.floor((index % (21 * 28)) / 28);
  const finalIndex = index % 28;
  
  return [
    INITIALS[initialIndex] || '',
    MEDIALS[medialIndex] || '',
    FINALS[finalIndex] || ''
  ];
};

/**
 * 한국어 자모를 영어 QWERTY 키보드 자판에 대응되는 문자로 변환합니다.
 * @param text 변환할 한국어 문자열
 * @returns 변환된 영문자 문자열
 */
export const convertKorToEng = (text: string): string => {
  return text.split('').map(char => {
    // 이미 매핑에 있는 문자는 그대로 반환 (예: 'ㅏ', 'ㄱ' 등)
    if (KOR_TO_ENG[char]) {
      return KOR_TO_ENG[char];
    }
    
    // 한글 음절인 경우 분해하여 변환
    const [initial, medial, final] = decomposeHangul(char);
    const initialEng = initial ? (KOR_TO_ENG[initial] || '') : '';
    const medialEng = medial ? (KOR_TO_ENG[medial] || '') : '';
    const finalEng = final ? (KOR_TO_ENG[final] || '') : '';
    
    // 분해된 자모를 조합 (예: '가' -> 'rk')
    const combined = initialEng + medialEng + finalEng;
    
    // 변환된 결과가 있으면 반환, 없으면 원본 문자 반환
    return combined || char;
  }).join('');
};

/**
 * 한국어 입력을 고려하여 검색어를 정규화합니다.
 * 한국어 자모를 영어 QWERTY로 변환한 후, 대소문자 구분 없이 검색할 수 있도록 소문자로 변환합니다.
 * @param searchTerm 검색어
 * @returns 정규화된 검색어
 */
export const normalizeSearchTerm = (searchTerm: string): string => {
  const normalized = convertKorToEng(searchTerm).toLowerCase().trim();
  return normalized;
};

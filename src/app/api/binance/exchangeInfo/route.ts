import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/packages/shared/constants/exchange';

/**
 * Binance exchangeInfo API 프록시
 * CORS 문제를 해결하기 위한 서버사이드 프록시
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch((API_ENDPOINTS.binance.api.spot as any).exchangeInfo, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5분 캐시
      },
    });
  } catch (error) {
    console.error('Binance exchangeInfo 프록시 오류:', error);
    return NextResponse.json(
      { error: 'Binance exchangeInfo 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

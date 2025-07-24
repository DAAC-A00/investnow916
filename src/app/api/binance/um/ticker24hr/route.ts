import { NextRequest, NextResponse } from 'next/server';

/**
 * Binance USD-M Futures 24hr ticker API 프록시
 * CORS 문제를 해결하기 위한 서버사이드 프록시
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance USD-M API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 1분 캐시
      },
    });
  } catch (error) {
    console.error('Binance USD-M 24hr ticker 프록시 오류:', error);
    return NextResponse.json(
      { error: 'Binance USD-M 24hr ticker 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 
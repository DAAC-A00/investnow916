import React from 'react';
import { useRouter } from 'next/navigation';

interface TickerHeaderProps {
  title: string;
  subtitle: string;
  isLoading: boolean;
  lastUpdate: Date | null;
  totalCount: number;
  error?: string | null;
  onRefresh?: () => void;
}

export function TickerHeader({
  title,
  subtitle,
  isLoading,
  lastUpdate,
  totalCount,
  error,
  onRefresh
}: TickerHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg border border-border"
            >
              새로고침
            </button>
          )}
          <button
            onClick={() => router.push('/exchange')}
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg border border-border"
          >
            ← 거래소 메뉴
          </button>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span>{isLoading ? '데이터 로딩 중...' : '실시간 업데이트'}</span>
        </div>
        {lastUpdate && (
          <div>
            마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
          </div>
        )}
        <div>
          총 {totalCount}개 코인
        </div>
        {error && (
          <div className="text-yellow-600">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
} 
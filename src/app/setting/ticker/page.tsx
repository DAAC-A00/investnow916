"use client";

import { useTickerSettingStore, TickerColorMode } from '@/packages/shared/stores/createTickerSettingStore';

const COLOR_MODE_LABELS: Record<TickerColorMode, string> = {
  global: 'Global (기본)',
  aisa: 'Aisa (상승=빨강/하락=파랑)',
  nothing: 'Nothing (일반 글자색)',
  shadow: 'Shadow (회색)',
};

export default function TickerSettingPage() {
  const tickerColorMode = useTickerSettingStore((s) => s.tickerColorMode);
  const setTickerColorMode = useTickerSettingStore((s) => s.setTickerColorMode);

  return (
    <div className="container max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">티커 색상 모드 설정</h1>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">색상 모드 선택</label>
        <div className="flex gap-2">
          {Object.entries(COLOR_MODE_LABELS).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTickerColorMode(mode as TickerColorMode)}
              className={`px-3 py-2 rounded border transition text-sm
                ${tickerColorMode === mode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <div className="font-semibold mb-2">예시 티커 색상 미리보기</div>
        <div className="flex gap-4">
          {[{label:'상승 예시',change:1.25},{label:'하락 예시',change:-0.87},{label:'보합 예시',change:0}].map((ex) => (
            <div
              key={ex.label}
              className={`px-4 py-2 rounded bg-card shadow text-lg font-semibold ${(() => {
                switch (tickerColorMode) {
                  case 'global':
                    if (ex.change > 0) return 'text-green-500';
                    if (ex.change < 0) return 'text-red-500';
                    return 'text-muted-foreground';
                  case 'aisa':
                    if (ex.change > 0) return 'text-red-500';
                    if (ex.change < 0) return 'text-blue-500';
                    return 'text-muted-foreground';
                  case 'nothing':
                    return 'text-foreground';
                  case 'shadow':
                    return 'text-gray-400';
                  default:
                    return 'text-foreground';
                }
              })()}`}
            >
              {ex.label} {ex.change > 0 ? `+${ex.change}` : ex.change}%
            </div>
          ))}
        </div>
      </div>
      <div className="text-muted-foreground text-sm">
        이 설정은 전체 티커 화면에 적용됩니다.
      </div>
    </div>
  );
}

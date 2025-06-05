'use client';

import React, { useState } from 'react';
import { designTokens } from '@/packages/ui-kit/tokens/design-tokens';

// 간단한 카드 컴포넌트 구현
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// 간단한 버튼 컴포넌트
const Button = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 배지 컴포넌트
const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: string;
}) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive text-destructive-foreground',
    outline: 'text-foreground',
    success: 'border-transparent bg-success text-success-foreground',
    warning: 'border-transparent bg-warning text-warning-foreground',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// 진행 표시줄 컴포넌트
const Progress = ({ 
  value, 
  className = '',
  indicatorClassName = ''
}: { 
  value: number;
  className?: string;
  indicatorClassName?: string;
}) => {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className={`h-full rounded-full bg-primary transition-all duration-300 ${indicatorClassName}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

// 탭 컴포넌트들
const Tabs = ({ 
  children, 
  defaultValue, 
  className = '' 
}: { 
  children: React.ReactNode; 
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const childrenArray = React.Children.toArray(children);
  const tabsList = childrenArray.find((child: any) => child.type === TabsList);
  const tabsContent = childrenArray.filter((child: any) => child.type === TabsContent);

  return (
    <div className={className}>
      {tabsList && React.cloneElement(tabsList as any, { activeTab, setActiveTab })}
      {tabsContent.map((content) => 
        React.cloneElement(content as any, { 
          key: (content as any).props.value,
          isActive: (content as any).props.value === activeTab 
        })
      )}
    </div>
  );
};

const TabsList = ({ 
  children, 
  activeTab, 
  setActiveTab,
  className = '' 
}: { 
  children: React.ReactNode; 
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  className?: string;
}) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {React.Children.map(children, (child: any) => 
        React.cloneElement(child, { 
          isActive: child.props.value === activeTab,
          onClick: () => setActiveTab?.(child.props.value)
        })
      )}
    </div>
  );
};

const TabsTrigger = ({ 
  children, 
  value, 
  isActive = false, 
  onClick,
  className = '' 
}: { 
  children: React.ReactNode; 
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? 'bg-background text-foreground shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ 
  children, 
  value, 
  isActive = false,
  className = '' 
}: { 
  children: React.ReactNode; 
  value: string;
  isActive?: boolean;
  className?: string;
}) => {
  if (!isActive) return null;
  
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

// 색상 그룹 타입 정의
interface ColorGroup {
  name: string;
  colors: Record<string, string>;
  description?: string;
}

export default function ColorPage() {
  // 그레이 스케일 색상 그룹
  const grayColors: ColorGroup[] = [
    {
      name: 'Gray Scale',
      colors: {
        '50': `hsl(${designTokens.colors.gray[50]})`,
        '100': `hsl(${designTokens.colors.gray[100]})`,
        '200': `hsl(${designTokens.colors.gray[200]})`,
        '300': `hsl(${designTokens.colors.gray[300]})`,
        '400': `hsl(${designTokens.colors.gray[400]})`,
        '500': `hsl(${designTokens.colors.gray[500]})`,
        '600': `hsl(${designTokens.colors.gray[600]})`,
        '700': `hsl(${designTokens.colors.gray[700]})`,
        '800': `hsl(${designTokens.colors.gray[800]})`,
        '900': `hsl(${designTokens.colors.gray[900]})`,
      },
      description: '텍스트, 배경, 경계선 등에 사용되는 그레이 스케일 색상입니다.',
    },
  ];

  // 프라이머리 색상 그룹
  const primaryColors: ColorGroup[] = [
    {
      name: 'Primary',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.primary.DEFAULT})`,
        '500': `hsl(${designTokens.colors.primary[500]})`,
        '600': `hsl(${designTokens.colors.primary[600]})`,
      },
      description: '주요 브랜드 색상으로, 버튼, 링크, 강조 요소 등에 사용됩니다.',
    },
    {
      name: 'Secondary',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.secondary.DEFAULT})`,
        '500': `hsl(${designTokens.colors.secondary[500]})`,
        '600': `hsl(${designTokens.colors.secondary[600]})`,
      },
      description: '보조 색상으로, 보라색 계열입니다.',
    },
  ];

  // 상태 색상 그룹
  const statusColors: ColorGroup[] = [
    {
      name: 'Success',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.success.DEFAULT})`,
        '500': `hsl(${designTokens.colors.success[500]})`,
        '600': `hsl(${designTokens.colors.success[600]})`,
      },
      description: '성공 상태나 긍정적인 액션에 사용되는 색상입니다.',
    },
    {
      name: 'Error',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.error.DEFAULT})`,
        '500': `hsl(${designTokens.colors.error[500]})`,
        '600': `hsl(${designTokens.colors.error[600]})`,
      },
      description: '오류 상태나 부정적인 액션에 사용되는 색상입니다.',
    },
    {
      name: 'Warning',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.warning.DEFAULT})`,
        '500': `hsl(${designTokens.colors.warning[500]})`,
        '600': `hsl(${designTokens.colors.warning[600]})`,
      },
      description: '경고나 주의가 필요한 상태에 사용되는 색상입니다.',
    },
    {
      name: 'Accent',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.accent.DEFAULT})`,
        '500': `hsl(${designTokens.colors.accent[500]})`,
        '600': `hsl(${designTokens.colors.accent[600]})`,
      },
      description: '강조 색상으로, 티파니 블루 계열입니다.',
    },
  ];

  // 보조 색상 그룹
  const accentColors: ColorGroup[] = [
    {
      name: 'Gray',
      colors: {
        'DEFAULT': `hsl(${designTokens.colors.gray.DEFAULT})`,
        '300': `hsl(${designTokens.colors.gray[300]})`,
        '600': `hsl(${designTokens.colors.gray[600]})`,
        '900': `hsl(${designTokens.colors.gray[900]})`,
      },
      description: '중성 색상으로, 텍스트, 배경, 경계선 등에 사용됩니다.',
    },
    {
      name: 'Financial Colors',
      colors: {
        'up': `hsl(${designTokens.colors.financial.up})`,
        'down': `hsl(${designTokens.colors.financial.down})`,
        'unchanged': `hsl(${designTokens.colors.financial.unchanged})`,
        'volume': `hsl(${designTokens.colors.financial.volume})`,
      },
      description: '금융 데이터 표시에 사용되는 전용 색상입니다.',
    },
  ];

  // 차트 색상 그룹
  const chartColors: ColorGroup[] = [
    {
      name: 'Chart Colors',
      colors: {
        'chart-1': `hsl(${designTokens.colors.chart[1]})`,
        'chart-2': `hsl(${designTokens.colors.chart[2]})`,
        'chart-3': `hsl(${designTokens.colors.chart[3]})`,
        'chart-4': `hsl(${designTokens.colors.chart[4]})`,
        'chart-5': `hsl(${designTokens.colors.chart[5]})`,
        'chart-6': `hsl(${designTokens.colors.chart[6]})`,
      },
      description: '차트 및 데이터 시각화에 사용되는 색상 팔레트입니다.',
    },
  ];

  // 테마 토큰 색상 그룹 (CSS 변수 사용)
  const themeTokenColors: ColorGroup[] = [
    {
      name: 'Background & Foreground',
      colors: {
        'background': 'hsl(var(--background))',
        'foreground': 'hsl(var(--foreground))',
      },
      description: '기본 배경색과 전경(텍스트) 색상입니다.',
    },
    {
      name: 'Card & Popover',
      colors: {
        'card': 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        'popover': 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
      },
      description: '카드와 팝오버 컴포넌트에 사용되는 색상입니다.',
    },
    {
      name: 'UI Elements',
      colors: {
        'border': 'hsl(var(--border))',
        'input': 'hsl(var(--input))',
        'ring': 'hsl(var(--ring))',
        'muted': 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
      },
      description: '경계선, 입력 필드, 포커스 링 등 UI 요소에 사용되는 색상입니다.',
    },
  ];

  // 색상 카드 컴포넌트
  const ColorCard = ({ name, color, value }: { name: string; color: string; value: string }) => {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div 
          className="w-24 h-24 rounded-lg border border-border shadow-sm" 
          style={{ backgroundColor: color }}
        />
        <div className="text-center">
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-muted-foreground font-mono">{value}</div>
        </div>
      </div>
    );
  };

  // 색상 그룹 섹션 컴포넌트
  const ColorGroupSection = ({ 
    title, 
    description,
    colorGroups 
  }: { 
    title: string; 
    description?: string;
    colorGroups: ColorGroup[];
  }) => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
        <div className="space-y-8">
          {colorGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              {group.description && <p className="text-muted-foreground">{group.description}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {Object.entries(group.colors).map(([key, value]) => (
                  <ColorCard 
                    key={key} 
                    name={key} 
                    color={value} 
                    value={value} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">색상 시스템</h1>
        <p className="text-muted-foreground">
          프로젝트에서 사용되는 색상 팔레트와 활용 예시입니다.
        </p>
      </div>

      {/* 테마 색상 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ColorGroupSection 
            title="그레이 스케일" 
            description="텍스트, 배경, 경계선 등에 사용되는 그레이 스케일 색상입니다."
            colorGroups={grayColors} 
          />
          
          <ColorGroupSection 
            title="프라이머리 색상" 
            description="주요 브랜드 색상과 정보성 메시지에 사용되는 색상입니다."
            colorGroups={primaryColors} 
          />
          
          <ColorGroupSection 
            title="상태 색상" 
            description="성공, 경고, 오류 등 다양한 상태를 나타내는 색상입니다."
            colorGroups={statusColors} 
          />
          
          <ColorGroupSection 
            title="보조 색상" 
            description="강조, 포인트 요소 등에 사용되는 보조 색상들입니다."
            colorGroups={accentColors} 
          />
          
          <ColorGroupSection 
            title="테마 토큰" 
            description="일관된 디자인을 위한 CSS 변수 기반의 테마 토큰 색상입니다."
            colorGroups={themeTokenColors} 
          />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>테마 색상 활용 예시</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">버튼</p>
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">기본</Button>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm">보조</Button>
                  <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm">위험</Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">링크</p>
                <div>
                  <Button variant="link" className="text-primary hover:underline p-0 h-auto">링크 버튼 예시</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 차트 색상 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ColorGroupSection 
            title="차트 색상" 
            description="차트 및 데이터 시각화에 사용되는 색상 팔레트입니다."
            colorGroups={chartColors} 
          />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>차트 색상 활용 예시</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                <div className="flex flex-col items-center">
                  <div className="w-5 bg-chart-1 h-20 flex items-end justify-center text-white text-[10px] p-1">1</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 bg-chart-2 h-32 flex items-end justify-center text-white text-[10px] p-1">2</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 bg-chart-3 h-24 flex items-end justify-center text-white text-[10px] p-1">3</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 bg-chart-4 h-28 flex items-end justify-center text-white text-[10px] p-1">4</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 bg-chart-5 h-16 flex items-end justify-center text-white text-[10px] p-1">5</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">시리즈 1~5에 사용되는 차트 색상</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 디자인 토큰 색상 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ColorGroupSection 
            title="테마 토큰" 
            description="일관된 디자인을 위한 CSS 변수 기반의 테마 토큰 색상입니다."
            colorGroups={themeTokenColors} 
          />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>상태 표시 예시</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">배지</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary text-primary-foreground">기본</Badge>
                  <Badge className="bg-secondary text-secondary-foreground">보조</Badge>
                  <Badge className="bg-destructive text-destructive-foreground">위험</Badge>
                  <Badge className="bg-green-500 text-white">성공</Badge>
                  <Badge className="bg-amber-500 text-white">경고</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">진행 상태</p>
                <div className="space-y-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[40%] bg-primary" />
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[60%] bg-green-500" />
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[80%] bg-amber-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

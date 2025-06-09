'use client';

import React, { useState, useEffect } from 'react';
import { 
  colorTokens, 
  getColor, 
  getTickerColor, 
  getTickerBackgroundColor,
  type TickerColorMode 
} from '@/packages/ui-kit/tokens/design-tokens';
import { Toggle, RatingStars, ChipSelection } from '@/packages/ui-kit/web/components';

// Simple UI components to replace missing imports
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  onClick, 
  className = '',
  style,
  ...props 
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
  };
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
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

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '', style }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input'
  };
  
  return (
    <div 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

const Tabs = ({ children, defaultValue, value, onValueChange, className }: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');
  
  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };
  
  return (
    <div className={className} data-active-tab={activeTab}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, onTabChange: handleTabChange } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, className = '', activeTab, onTabChange }: { 
  children: React.ReactNode; 
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { activeTab, onTabChange } as any);
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ children, value, className = '', activeTab, onTabChange }: { 
  children: React.ReactNode; 
  value: string;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}) => {
  const isActive = activeTab === value;
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow-sm' : ''} ${className}`}
      onClick={() => onTabChange?.(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className = '', activeTab }: { 
  children: React.ReactNode; 
  value: string;
  className?: string;
  activeTab?: string;
}) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

const Separator = ({ className = '' }: { className?: string }) => (
  <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />
);

// Simple icons
const Copy = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const Sun = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const Moon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const TrendingUp = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TrendingDown = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const Minus = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Palette = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707"></path>
  </svg>
);

export default function ColorPage() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [tickerMode, setTickerMode] = useState<TickerColorMode>('semantic');
  const [activeTab, setActiveTab] = useState('palette');

  // 테마 감지 및 변경 감지
  useEffect(() => {
    // 초기 테마 감지
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    detectTheme();

    // DOM 변경 감지 (테마 변경 시)
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 테마 토글 함수
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setCurrentTheme(newTheme);
  };

  // 현재 테마의 색상 가져오기
  const themeColors = colorTokens[currentTheme];

  // 색상 카드 컴포넌트
  const ColorCard = ({ name, color, value }: { name: string; color: string; value: string }) => (
    <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="h-24 w-full"
        style={{ backgroundColor: `hsl(${color})` }}
      />
      <div className="p-3">
        <h4 className="font-medium text-sm">{name}</h4>
        <button 
          onClick={() => navigator.clipboard.writeText(`hsl(${color})`)} 
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          복사
        </button>
        <p className="text-xs text-muted-foreground mt-1 font-mono">hsl({color})</p>
        <p className="text-xs text-muted-foreground font-mono">{value}</p>
      </div>
    </div>
  );

  // 색상 그룹 섹션 컴포넌트
  const ColorGroupSection = ({ 
    title, 
    description, 
    colors 
  }: { 
    title: string; 
    description: string; 
    colors: Array<{ name: string; color: string; value: string }>;
  }) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {colors.map((color) => (
          <ColorCard key={color.name} {...color} />
        ))}
      </div>
    </div>
  );

  // 색상 그룹 데이터
  const colorGroups = [
    {
      title: 'Primary',
      description: '주요 브랜드 색상 - 모노크롬 블랙 & 화이트',
      colors: Object.entries(themeColors.primary).map(([key, value]) => ({
        name: key,
        color: value,
        value: `primary.${key}`,
      })),
    },
    {
      title: 'Secondary',
      description: '보조 색상 - 우아한 퍼플 팔레트',
      colors: Object.entries(themeColors.secondary).map(([key, value]) => ({
        name: key,
        color: value,
        value: `secondary.${key}`,
      })),
    },
    {
      title: 'Tertiary',
      description: '3차 색상 - 신선한 민트 팔레트',
      colors: Object.entries(themeColors.tertiary).map(([key, value]) => ({
        name: key,
        color: value,
        value: `tertiary.${key}`,
      })),
    },
    {
      title: 'Accent',
      description: '강조 색상 - 프리미엄 골드',
      colors: Object.entries(themeColors.accent).map(([key, value]) => ({
        name: key,
        color: value,
        value: `accent.${key}`,
      })),
    },
    {
      title: 'Success',
      description: '성공/긍정 상태를 나타내는 색상',
      colors: Object.entries(themeColors.success).map(([key, value]) => ({
        name: key,
        color: value,
        value: `success.${key}`,
      })),
    },
    {
      title: 'Error',
      description: '오류/위험 상태를 나타내는 색상',
      colors: Object.entries(themeColors.error).map(([key, value]) => ({
        name: key,
        color: value,
        value: `error.${key}`,
      })),
    },
    {
      title: 'Warning',
      description: '경고/주의 상태를 나타내는 색상',
      colors: Object.entries(themeColors.warning).map(([key, value]) => ({
        name: key,
        color: value,
        value: `warning.${key}`,
      })),
    },
    {
      title: 'Neutral',
      description: '중성 색상 - 텍스트, 배경, 테두리용',
      colors: Object.entries(themeColors.neutral).map(([key, value]) => ({
        name: key,
        color: value,
        value: `neutral.${key}`,
      })),
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">색상 시스템</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {currentTheme === 'light' ? '라이트 모드' : '다크 모드'}
          </Badge>
        </div>
      </div>

      <p className="text-muted-foreground">
        InvestNow916의 디자인 시스템에서 사용되는 모든 색상 토큰을 확인하고 관리할 수 있습니다.
        현재 <strong>{currentTheme === 'light' ? '라이트' : '다크'}</strong> 모드의 색상이 표시됩니다.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="palette">색상 팔레트</TabsTrigger>
          <TabsTrigger value="components">컴포넌트 예시</TabsTrigger>
        </TabsList>

        <TabsContent value="palette" className="space-y-8">
          {colorGroups.map((group, index) => (
            <div key={group.title}>
              <ColorGroupSection {...group} />
              {index < colorGroups.length - 1 && <Separator className="mt-8" />}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Primary Button</CardTitle>
                <CardDescription>주요 액션 버튼</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.primary[900]})`,
                    color: `hsl(${themeColors.primary.foreground})`
                  }}
                >
                  Primary Action
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  style={{ 
                    borderColor: `hsl(${themeColors.primary[200]})`,
                    color: `hsl(${themeColors.primary[700]})`
                  }}
                >
                  Secondary Action
                </Button>
              </CardContent>
            </Card>

            {/* Secondary Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Secondary Elements</CardTitle>
                <CardDescription>보조 색상 활용</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-3 rounded-md text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.secondary[100]})`,
                    color: `hsl(${themeColors.secondary[800]})`
                  }}
                >
                  Secondary Background
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: `hsl(${themeColors.secondary[500]})`,
                    color: `hsl(${themeColors.secondary.foreground})`
                  }}
                >
                  Purple Badge
                </Badge>
              </CardContent>
            </Card>

            {/* Accent Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Accent Elements</CardTitle>
                <CardDescription>강조 색상 활용</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-3 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.accent[100]})`,
                    color: `hsl(${themeColors.accent[800]})`
                  }}
                >
                  Premium Feature
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: `hsl(${themeColors.accent[500]})`,
                    color: `hsl(${themeColors.accent.foreground})`
                  }}
                >
                  Gold Badge
                </Badge>
              </CardContent>
            </Card>

            {/* Status Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Indicators</CardTitle>
                <CardDescription>상태 표시 색상</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-2 rounded text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.success[100]})`,
                    color: `hsl(${themeColors.success[800]})`
                  }}
                >
                  ✓ Success Message
                </div>
                <div 
                  className="p-2 rounded text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.error[100]})`,
                    color: `hsl(${themeColors.error[800]})`
                  }}
                >
                  ✗ Error Message
                </div>
                <div 
                  className="p-2 rounded text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.warning[100]})`,
                    color: `hsl(${themeColors.warning[800]})`
                  }}
                >
                  ⚠ Warning Message
                </div>
              </CardContent>
            </Card>

            {/* Neutral Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Neutral Elements</CardTitle>
                <CardDescription>중성 색상 활용</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-3 rounded border text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.neutral[50]})`,
                    borderColor: `hsl(${themeColors.neutral[200]})`,
                    color: `hsl(${themeColors.neutral[700]})`
                  }}
                >
                  Card Background
                </div>
                <div 
                  className="text-xs"
                  style={{ color: `hsl(${themeColors.neutral[500]})` }}
                >
                  Muted Text
                </div>
              </CardContent>
            </Card>

            {/* Tertiary Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tertiary Elements</CardTitle>
                <CardDescription>민트 색상 활용</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-3 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.tertiary[100]})`,
                    color: `hsl(${themeColors.tertiary[800]})`
                  }}
                >
                  Fresh Mint Background
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: `hsl(${themeColors.tertiary[500]})`,
                    color: `hsl(${themeColors.tertiary.foreground})`
                  }}
                >
                  New Feature
                </Badge>
                <Button
                  style={{
                    backgroundColor: `hsl(${themeColors.tertiary[600]})`,
                    color: `hsl(${themeColors.tertiary.foreground})`
                  }}
                >
                  Tertiary Action
                </Button>
              </CardContent>
            </Card>

            {/* Navigation Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Navigation Menu</CardTitle>
                <CardDescription>네비게이션 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div 
                  className="p-2 rounded"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.primary[50]})`,
                    borderLeft: `3px solid hsl(${themeColors.primary[500]})`
                  }}
                >
                  <div 
                    className="text-sm font-medium"
                    style={{ color: `hsl(${themeColors.primary[700]})` }}
                  >
                    Active Menu Item
                  </div>
                </div>
                <div 
                  className="p-2 rounded hover:bg-opacity-50 cursor-pointer transition-colors"
                  style={{ 
                    color: `hsl(${themeColors.neutral[600]})`,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `hsl(${themeColors.neutral[100]})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="text-sm">Inactive Menu Item</div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress Indicators</CardTitle>
                <CardDescription>진행률 표시 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: `hsl(${themeColors.neutral[600]})` }}>
                    Loading Progress (75%)
                  </div>
                  <div 
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: `hsl(${themeColors.neutral[200]})` }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: '75%',
                        backgroundColor: `hsl(${themeColors.primary[500]})`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: `hsl(${themeColors.neutral[600]})` }}>
                    Success Rate (90%)
                  </div>
                  <div 
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: `hsl(${themeColors.neutral[200]})` }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: '90%',
                        backgroundColor: `hsl(${themeColors.success[500]})`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Forms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Form Elements</CardTitle>
                <CardDescription>입력 폼 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label 
                    className="text-sm font-medium mb-1 block"
                    style={{ color: `hsl(${themeColors.neutral[700]})` }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-2 rounded border text-sm focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: `hsl(${themeColors.neutral[300]})`,
                      backgroundColor: `hsl(${themeColors.neutral[50]})`,
                      color: `hsl(${themeColors.neutral[900]})`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = `hsl(${themeColors.primary[500]})`;
                      e.target.style.boxShadow = `0 0 0 2px hsl(${themeColors.primary[500]} / 0.2)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `hsl(${themeColors.neutral[300]})`;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="text-sm font-medium mb-1 block"
                    style={{ color: `hsl(${themeColors.neutral[700]})` }}
                  >
                    Message
                  </label>
                  <textarea
                    placeholder="Enter your message"
                    rows={3}
                    className="w-full p-2 rounded border text-sm focus:outline-none focus:ring-2 transition-colors resize-none"
                    style={{
                      borderColor: `hsl(${themeColors.neutral[300]})`,
                      backgroundColor: `hsl(${themeColors.neutral[50]})`,
                      color: `hsl(${themeColors.neutral[900]})`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = `hsl(${themeColors.primary[500]})`;
                      e.target.style.boxShadow = `0 0 0 2px hsl(${themeColors.primary[500]} / 0.2)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `hsl(${themeColors.neutral[300]})`;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Display Cards</CardTitle>
                <CardDescription>데이터 표시 카드</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.neutral[50]})`,
                    borderColor: `hsl(${themeColors.neutral[200]})`
                  }}
                >
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: `hsl(${themeColors.primary[600]})` }}
                  >
                    $12,345
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: `hsl(${themeColors.neutral[600]})` }}
                  >
                    Total Revenue
                  </div>
                  <div 
                    className="text-xs mt-1 flex items-center"
                    style={{ color: `hsl(${themeColors.success[600]})` }}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5% from last month
                  </div>
                </div>
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.accent[50]})`,
                    borderColor: `hsl(${themeColors.accent[200]})`
                  }}
                >
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: `hsl(${themeColors.accent[600]})` }}
                  >
                    1,234
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: `hsl(${themeColors.neutral[600]})` }}
                  >
                    Premium Users
                  </div>
                  <Badge 
                    className="mt-2"
                    style={{ 
                      backgroundColor: `hsl(${themeColors.accent[500]})`,
                      color: `hsl(${themeColors.accent.foreground})`
                    }}
                  >
                    VIP
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notification Toast */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notification Toasts</CardTitle>
                <CardDescription>알림 토스트 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="p-3 rounded-lg border-l-4 flex items-start space-x-3"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.success[50]})`,
                    borderLeftColor: `hsl(${themeColors.success[500]})`
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: `hsl(${themeColors.success[500]})`,
                      color: `hsl(${themeColors.success.foreground})`
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: `hsl(${themeColors.success[800]})` }}
                    >
                      Success!
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: `hsl(${themeColors.success[600]})` }}
                    >
                      Your changes have been saved successfully.
                    </div>
                  </div>
                </div>
                <div 
                  className="p-3 rounded-lg border-l-4 flex items-start space-x-3"
                  style={{ 
                    backgroundColor: `hsl(${themeColors.warning[50]})`,
                    borderLeftColor: `hsl(${themeColors.warning[500]})`
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: `hsl(${themeColors.warning[500]})`,
                      color: `hsl(${themeColors.warning.foreground})`
                    }}
                  >
                    !
                  </div>
                  <div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: `hsl(${themeColors.warning[800]})` }}
                    >
                      Warning
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: `hsl(${themeColors.warning[600]})` }}
                    >
                      Please review your settings before proceeding.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Elements - Toggle Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Toggle Components</CardTitle>
                <CardDescription>토글 스위치 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  {/* Usable Toggle - Default Off */}
                  <Toggle
                    label="Toggle (Usable - Default Off)"
                    defaultActive={false}
                    disabled={false}
                    themeColors={themeColors}
                    currentTheme={currentTheme}
                    onChange={(active) => console.log('Toggle (Off) changed:', active)}
                  />
                  
                  {/* Usable Toggle - Default On */}
                  <Toggle
                    label="Toggle (Usable - Default On)"
                    defaultActive={true}
                    disabled={false}
                    themeColors={themeColors}
                    currentTheme={currentTheme}
                    onChange={(active) => console.log('Toggle (On) changed:', active)}
                  />
                  
                  {/* Unusable Toggle */}
                  <Toggle
                    label="Toggle (Unusable)"
                    defaultActive={false}
                    disabled={true}
                    themeColors={themeColors}
                    currentTheme={currentTheme}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interactive Elements - Other Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interactive Components</CardTitle>
                <CardDescription>기타 상호작용 컴포넌트</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating Stars */}
                <RatingStars
                  label="Rating Stars"
                  maxStars={5}
                  defaultRating={4}
                  themeColors={themeColors}
                  currentTheme={currentTheme}
                  onChange={(rating) => console.log('Rating changed:', rating)}
                />
                
                {/* Chip Selection */}
                <ChipSelection
                  label="Chip Selection"
                  options={['React', 'TypeScript', 'Tailwind', 'Next.js']}
                  defaultSelected={[]}
                  multiple={true}
                  themeColors={themeColors}
                  currentTheme={currentTheme}
                  onChange={(selected) => console.log('Chips selected:', selected)}
                />
              </CardContent>
            </Card>

          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

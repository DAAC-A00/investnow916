import React from 'react';
import { colorTokens } from '../../ui-kit/tokens/design-tokens';
import { useTheme } from '../stores/createThemeStore';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  themeOverride?: 'light' | 'dark';
}

export const Button: React.FC<ButtonProps> = ({
  selected = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  themeOverride,
  disabled,
  ...rest
}) => {
  const theme = useTheme();
  const currentTheme = themeOverride || theme || 'light';
  const colors = colorTokens[currentTheme];

  // 기본 스타일
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-2 font-medium',
    'rounded-lg border transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'transform active:scale-[0.98]',
    className
  );

  // 크기별 스타일
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  };

  // variant별 스타일 및 색상
  const getVariantStyles = () => {
    const isSelected = selected;
    
    switch (variant) {
      case 'primary':
        return {
          className: cn(
            'shadow-sm',
            isSelected 
              ? 'bg-primary/90 text-primary-foreground border-primary/90' 
              : 'bg-primary text-primary-foreground border-primary',
            'hover:bg-primary/90 hover:shadow-md',
            'active:shadow-sm'
          ),
          style: {
            backgroundColor: isSelected 
              ? `hsl(${colors.primary[950]})` 
              : `hsl(${colors.primary[900]})`,
            color: `hsl(${colors.primary.foreground})`,
            borderColor: `hsl(${colors.primary[800]})`,
          }
        };

      case 'secondary':
        return {
          className: cn(
            'shadow-sm',
            isSelected 
              ? 'bg-secondary/90 text-secondary-foreground border-secondary/90' 
              : 'bg-secondary text-secondary-foreground border-secondary',
            'hover:bg-secondary/90 hover:shadow-md',
            'active:shadow-sm'
          ),
          style: {
            backgroundColor: isSelected 
              ? `hsl(${colors.secondary[600]})` 
              : `hsl(${colors.secondary[500]})`,
            color: `hsl(${colors.secondary.foreground})`,
            borderColor: `hsl(${colors.secondary[400]})`,
          }
        };

      case 'tertiary':
        return {
          className: cn(
            'shadow-sm',
            isSelected 
              ? 'bg-tertiary text-tertiary-foreground border-tertiary' 
              : 'bg-tertiary/80 text-tertiary-foreground border-tertiary/80',
            'hover:bg-tertiary hover:shadow-md',
            'active:shadow-sm'
          ),
          style: {
            backgroundColor: isSelected 
              ? `hsl(${colors.tertiary[500]})` 
              : `hsl(${colors.tertiary[400]})`,
            color: `hsl(${colors.tertiary.foreground})`,
            borderColor: `hsl(${colors.tertiary[300]})`,
          }
        };

      case 'outline':
        return {
          className: cn(
            'bg-transparent border-2',
            isSelected 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-border text-foreground',
            'hover:border-primary hover:text-primary hover:bg-primary/5',
            'active:bg-primary/10'
          ),
          style: {
            backgroundColor: isSelected 
              ? `hsl(${colors.primary[50]})` 
              : 'transparent',
            color: isSelected 
              ? `hsl(${colors.primary[900]})` 
              : `hsl(${colors.neutral[700]})`,
            borderColor: isSelected 
              ? `hsl(${colors.primary[400]})` 
              : `hsl(${colors.neutral[300]})`,
          }
        };

      case 'ghost':
        return {
          className: cn(
            'bg-transparent border-transparent',
            isSelected 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground',
            'hover:text-primary hover:bg-primary/10',
            'active:bg-primary/20'
          ),
          style: {
            backgroundColor: isSelected 
              ? `hsl(${colors.primary[50]})` 
              : 'transparent',
            color: isSelected 
              ? `hsl(${colors.primary[900]})` 
              : `hsl(${colors.neutral[600]})`,
            borderColor: 'transparent',
          }
        };

      default:
        return {
          className: '',
          style: {}
        };
    }
  };

  const variantConfig = getVariantStyles();

  return (
    <button
      type="button"
      className={cn(baseStyles, sizeStyles[size], variantConfig.className)}
      style={variantConfig.style}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button; 
import React from 'react';

interface TickerEmptyStateProps {
  type: 'loading' | 'search' | 'data' | 'error';
  title: string;
  description: string;
  searchTerm?: string;
  onAction?: () => void;
  actionLabel?: string;
  errorMessage?: string;
}

export function TickerEmptyState({
  type,
  title,
  description,
  searchTerm,
  onAction,
  actionLabel,
  errorMessage
}: TickerEmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>;
      case 'search':
        return <div className="text-4xl mb-4">🔍</div>;
      case 'data':
        return <div className="text-4xl mb-4">📊</div>;
      case 'error':
        return <div className="text-4xl mb-4">❌</div>;
      default:
        return null;
    }
  };

  if (type === 'loading') {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          {getIcon()}
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">{title}</h2>
            <p className="text-destructive mb-4">{errorMessage}</p>
            {onAction && actionLabel && (
              <button
                onClick={onAction}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      {getIcon()}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-4">
        {type === 'search' && searchTerm ? `"${searchTerm}" 검색어와 일치하는 코인이 없습니다` : description}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
} 
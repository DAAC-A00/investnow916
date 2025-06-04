'use client';

import { useState, useEffect } from 'react';
import { useExchangeRateActions } from '@/packages/shared/stores/createExchangeRateStore';

/**
 * API 키 설정 페이지 컴포넌트
 */
export default function ApiKeySettingsPage() {
  const { getApiKey, setApiKey } = useExchangeRateActions();
  const [apiKey, setApiKeyLocal] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 저장된 API 키 로드
  useEffect(() => {
    const loadApiKey = () => {
      try {
        const savedKey = getApiKey();
        setApiKeyLocal(savedKey || '');
      } catch (error) {
        console.error('API 키를 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [getApiKey]);

  const handleSave = () => {
    try {
      setApiKey(apiKey);
      setIsSaved(true);
      
      // 3초 후 저장 완료 메시지 숨기기
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error('API 키 저장 중 오류 발생:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">API 키 설정</h1>
      
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">ExchangeRate-API 키</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">API 키</h3>
                <p className="text-sm text-muted-foreground">
                  환율 정보를 가져오기 위한 ExchangeRate-API 키를 입력하세요.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyLocal(e.target.value)}
                placeholder="API 키를 입력하세요"
                className="flex-1 px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
            
            {isSaved && (
              <p className="text-sm text-green-600 mt-2">
                API 키가 성공적으로 저장되었습니다.
              </p>
            )}
            
            <p className="text-sm text-muted-foreground mt-2">
              ExchangeRate-API에서 발급받은 API 키를 입력하세요. API 키는 브라우저에 저장됩니다.
            </p>
          </div>
          
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-2">API 키 발급 안내</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ExchangeRate-API에서 무료 API 키를 발급받으실 수 있습니다.
            </p>
            <a
              href="https://www.exchangerate-api.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-input bg-background rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              ExchangeRate-API 웹사이트 방문
            </a>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mt-8">
        <p>API 키는 브라우저의 로컬 스토리지에 안전하게 저장됩니다.</p>
      </div>
    </div>
  );
}

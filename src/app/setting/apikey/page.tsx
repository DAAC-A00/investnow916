'use client';

import { useState, useEffect } from 'react';
import { useExchangeRateActions } from '@/packages/shared/stores/createExchangeRateStore';
import { useThemeStore } from '@/packages/shared/stores/createThemeStore';
import { useApiKeyStatus, useApiKeyStatusActions } from '@/packages/shared/stores/createApiKeyStatusStore';

/**
 * API 키 설정 페이지 컴포넌트
 */
export default function ApiKeySettingsPage() {
  const { getApiKey, setApiKey } = useExchangeRateActions();
  const theme = useThemeStore((state) => state.theme);
  const [apiKey, setApiKeyLocal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const apiKeyStatus = useApiKeyStatus(apiKey);
  const { checkApiKey, setStatus, getStatusIcon, getStatusText } = useApiKeyStatusActions();
  
  // 컴포넌트 마운트 시 저장된 API 키 로드 및 상태 확인
  useEffect(() => {
    const loadAndCheckApiKey = async () => {
      try {
        const savedKey = getApiKey();
        setApiKeyLocal(savedKey || '');
        
        // 저장된 키가 있으면 상태 확인
        if (savedKey) {
          setStatus(savedKey, 'verifying');
          await checkApiKey(savedKey);
        }
      } catch (error) {
        console.error('API 키를 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndCheckApiKey();
  }, [getApiKey, checkApiKey, setStatus]);
  
  // API 키가 변경될 때마다 처리
  useEffect(() => {
    if (!apiKey) return;
    
    // 상태를 'verifying'으로 업데이트
    setStatus(apiKey, 'verifying');
    
    // API 키를 로컬 스토리지에 즉시 저장 (유효성 검사 결과와 무관하게)
    if (typeof window !== 'undefined') {
      localStorage.setItem('apikey-exchangerate', apiKey);
      setApiKey(apiKey); // 상태 업데이트
    }
    
    // 디바운싱을 사용하여 API 키 유효성 검사 (UI 피드백용)
    const timer = setTimeout(async () => {
      try {
        await checkApiKey(apiKey);
      } catch (error) {
        console.error('API 키 검증 중 오류:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [apiKey, checkApiKey, setApiKey, setStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API 키 설정</h1>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon(apiKeyStatus || 'unsaved', theme)}</span>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {getStatusText(apiKeyStatus || 'unsaved', apiKeyStatus === 'invalid' ? 'invalid' : undefined)}
            </span>
          </div>
        </div>
      </div>
      
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
                className="w-full p-2 border rounded bg-background text-foreground"
                placeholder="API 키를 입력하세요"
              />
            </div>
            
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

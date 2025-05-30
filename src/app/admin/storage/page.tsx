'use client';

import React, { useState, useEffect } from 'react';
import { useIsAdminModeEnabled } from '@/packages/shared/stores/createAdminModeStore';
import { useRouter } from 'next/navigation';

/**
 * Local Storage 관리 페이지
 * 
 * 관리자 모드에서만 접근 가능한 페이지로, Local Storage의 모든 항목을 조회하고 수정할 수 있습니다.
 */
export default function LocalStorageManagerPage() {
  const [storageItems, setStorageItems] = useState<{ key: string; value: string; size: number }[]>([]);
  const [filteredItems, setFilteredItems] = useState<{ key: string; value: string; size: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'key' | 'value'>('all');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  const isAdminMode = useIsAdminModeEnabled();
  const router = useRouter();

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsMounted(true);
    
    // 관리자 모드가 아니면 홈으로 리다이렉트
    if (!isAdminMode) {
      router.push('/');
    }
  }, [isAdminMode, router]);

  // Local Storage 항목 로드
  useEffect(() => {
    if (isMounted) {
      loadStorageItems();
    }
  }, [isMounted]);

  // 문자열의 바이트 크기 계산 함수
  const getByteSize = (str: string): number => {
    return new Blob([str]).size;
  };

  // 바이트를 읽기 쉬운 형식으로 변환
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Local Storage 항목 로드 함수
  const loadStorageItems = () => {
    try {
      const items: { key: string; value: string; size: number }[] = [];
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key) || '';
            const size = getByteSize(key + value);
            totalSize += size;
            items.push({ key, value, size });
          } catch (error) {
            console.error(`항목 로드 중 오류 (${key}):`, error);
            // 문제가 있는 항목은 건너뜀
            continue;
          }
        }
      }
      
      // 크기 기준으로 정렬 (큰 항목이 위로 오도록)
      items.sort((a, b) => b.size - a.size);
      
      setStorageItems(items);
      setFilteredItems(items);
      setTotalStorageSize(totalSize);
    } catch (error) {
      console.error('Local Storage 로드 실패:', error);
    }
  };

  // 검색 기능
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilteredItems(query);
  };

  // 검색 타입 변경 시 검색 결과 갱신
  useEffect(() => {
    if (searchQuery) {
      updateFilteredItems(searchQuery);
    }
  }, [searchType, searchQuery]);

  // 검색 결과 갱신 로직
  const updateFilteredItems = (query: string) => {
    const filtered = storageItems.filter(item => {
      const searchValue = query.toLowerCase();
      switch (searchType) {
        case 'key':
          return item.key.toLowerCase().includes(searchValue);
        case 'value':
          return item.value.toLowerCase().includes(searchValue);
        default:
          return item.key.toLowerCase().includes(searchValue) || 
                 item.value.toLowerCase().includes(searchValue);
      }
    });
    setFilteredItems(filtered);
  };

  // 전체 저장소 사용량 상태
  const [totalStorageSize, setTotalStorageSize] = useState<number>(0);
  
  // 전체 저장소 제한 확인
  const checkStorageQuota = (): { used: string; total: string; percent: number } => {
    try {
      // 대부분의 브라우저는 도메인당 약 5MB의 저장 용량을 제공
      const totalQuota = 5 * 1024 * 1024; // 5MB in bytes
      const used = totalStorageSize;
      const percent = Math.min(100, (used / totalQuota) * 100);
      
      return {
        used: formatBytes(used),
        total: formatBytes(totalQuota),
        percent
      };
    } catch (error) {
      console.error('저장소 할당량 확인 실패:', error);
      return { used: '0 Bytes', total: '알 수 없음', percent: 0 };
    }
  };
  
  const storageQuota = checkStorageQuota();

  // 새 항목 추가
  const handleAddItem = () => {
    if (!newKey.trim()) return;
    
    try {
      localStorage.setItem(newKey, newValue);
      loadStorageItems();
      setNewKey('');
      setNewValue('');
    } catch (error) {
      console.error('항목 추가 실패:', error);
      // 저장소 용량 초과 시 사용자에게 알림
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('저장소 용량이 가득 찼습니다. 일부 항목을 삭제한 후 다시 시도해주세요.');
      }
    }
  };

  // 항목 삭제
  const handleDeleteItem = (key: string) => {
    try {
      localStorage.removeItem(key);
      loadStorageItems();
    } catch (error) {
      console.error('항목 삭제 실패:', error);
    }
  };

  // 편집 모드 시작
  const handleStartEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  // 항목 업데이트
  const handleUpdateItem = () => {
    if (!editingKey) return;
    
    try {
      localStorage.setItem(editingKey, editValue);
      loadStorageItems();
      setEditingKey(null);
      setEditValue('');
    } catch (error) {
      console.error('항목 업데이트 실패:', error);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // 모든 항목 삭제
  const handleClearAll = () => {
    if (window.confirm('정말로 모든 Local Storage 항목을 삭제하시겠습니까?')) {
      try {
        localStorage.clear();
        loadStorageItems();
      } catch (error) {
        console.error('모든 항목 삭제 실패:', error);
      }
    }
  };

  // 클라이언트 사이드 렌더링 확인
  if (!isMounted) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  // 관리자 모드가 아니면 접근 불가 메시지 표시
  if (!isAdminMode) {
    return <div className="p-8 text-center">접근 권한이 없습니다. 관리자 모드를 활성화해주세요.</div>;
  }

  const renderAddForm = () => (
    <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-foreground">새 항목 추가</h2>
        <span className="text-xs text-muted-foreground">
          {storageQuota.percent >= 90 && (
            <span className="text-destructive font-medium">경고: 저장소가 거의 가득 찼습니다</span>
          )}
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="키"
          className="flex-1 p-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="값"
          className="flex-1 p-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  );

  // 저장소 사용량 표시 컴포넌트
  const renderStorageUsage = () => (
    <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-foreground">저장소 사용량</span>
        <span className="text-sm text-muted-foreground">{storageQuota.used} / {storageQuota.total}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300" 
          style={{ width: `${storageQuota.percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {storageQuota.percent.toFixed(2)}% 사용 중
        {storageQuota.percent >= 90 && (
          <span className="ml-2 text-destructive font-medium">⚠️ 경고: 저장소가 거의 가득 찼습니다.</span>
        )}
      </p>
    </div>
  );

  // 테이블 헤더 렌더링
  const renderTableHeader = () => (
    <tr className="border-b border-border">
      <th className="text-left p-3 w-1/4 font-medium text-foreground">키</th>
      <th className="text-left p-3 font-medium text-foreground">값</th>
      <th className="text-right p-3 w-32 font-medium text-foreground">작업</th>
    </tr>
  );

  // 테이블 행 렌더링
  const renderTableRow = (item: { key: string; value: string; size: number }) => (
    <tr key={item.key} className="border-b border-border hover:bg-accent/10 transition-colors">
      <td className="p-3 font-mono text-sm break-words min-w-[200px] w-1/4 align-top">
        <div className="break-all">{item.key}</div>
      </td>
      <td className="p-3 align-top">
        {editingKey === item.key ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
            autoFocus
          />
        ) : (
          <div className="font-mono text-sm break-words whitespace-pre-wrap max-w-2xl">
            {item.value || <span className="text-muted-foreground">(빈 값)</span>}
          </div>
        )}
      </td>

      <td className="p-3 text-right align-top">
        <div className="flex justify-end gap-2">
          {editingKey === item.key ? (
            <>
              <button
                onClick={handleUpdateItem}
                className="p-1.5 text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                aria-label="저장"
                title="저장"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                aria-label="취소"
                title="취소"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleStartEdit(item.key, item.value)}
                className="p-1.5 text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                aria-label="편집"
                title="편집"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteItem(item.key)}
                className="p-1.5 text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                aria-label="삭제"
                title="삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">저장소</h1>
          <p className="text-sm text-muted-foreground mt-1">
            브라우저의 로컬 스토리지에 저장된 데이터를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                <input
                  type="radio"
                  id="searchAll"
                  name="searchType"
                  value="all"
                  checked={searchType === 'all'}
                  onChange={(e) => setSearchType('all')}
                  className="h-4 w-4 text-primary border-border"
                />
                <label htmlFor="searchAll" className="text-sm">전체</label>
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  id="searchKey"
                  name="searchType"
                  value="key"
                  checked={searchType === 'key'}
                  onChange={(e) => setSearchType('key')}
                  className="h-4 w-4 text-primary border-border"
                />
                <label htmlFor="searchKey" className="text-sm">키</label>
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  id="searchValue"
                  name="searchType"
                  value="value"
                  checked={searchType === 'value'}
                  onChange={(e) => setSearchType('value')}
                  className="h-4 w-4 text-primary border-border"
                />
                <label htmlFor="searchValue" className="text-sm">값</label>
              </div>
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </button>
            )}
            <div className="ml-4 text-sm text-muted-foreground">
              {searchQuery ? (
                <>
                  {storageItems.length}개 중 {filteredItems.length}개
                </>
              ) : (
                <>
                  전체 {storageItems.length}개
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderStorageUsage()}
      {renderAddForm()}
      
      {/* 항목 목록 */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">저장된 항목</h2>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                disabled={storageItems.length === 0}
              >
                모두 삭제
              </button>
            </div>
          </div>
        </div>
        
        {storageItems.length === 0 ? (
          <div className="text-center p-12 border-b border-border">
            <div className="max-w-md mx-auto p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 1.38-.1"></path>
                  <path d="M12 7v5l3 3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">저장된 항목이 없습니다</h3>
              <p className="text-muted-foreground text-sm">
                위의 폼을 사용하여 새 항목을 추가하세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                {renderTableHeader()}
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => renderTableRow(item))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

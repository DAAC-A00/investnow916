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
  const [storageItems, setStorageItems] = useState<{ key: string; value: string }[]>([]);
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

  // Local Storage 항목 로드 함수
  const loadStorageItems = () => {
    try {
      const items: { key: string; value: string }[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          items.push({ key, value });
        }
      }
      
      setStorageItems(items);
    } catch (error) {
      console.error('Local Storage 로드 실패:', error);
    }
  };

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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Local Storage 관리</h1>
      
      {/* 새 항목 추가 폼 */}
      <div className="bg-card p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">새 항목 추가</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="키"
            className="flex-1 p-2 border border-border rounded bg-background"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="값"
            className="flex-1 p-2 border border-border rounded bg-background"
          />
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            추가
          </button>
        </div>
      </div>
      
      {/* 항목 목록 */}
      <div className="bg-card p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">저장된 항목 ({storageItems.length})</h2>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
          >
            모두 삭제
          </button>
        </div>
        
        {storageItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">저장된 항목이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">키</th>
                  <th className="text-left p-2">값</th>
                  <th className="text-right p-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {storageItems.map((item) => (
                  <tr key={item.key} className="border-b border-border hover:bg-accent/30">
                    <td className="p-2 font-mono text-sm">{item.key}</td>
                    <td className="p-2">
                      {editingKey === item.key ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-1 border border-border rounded bg-background"
                        />
                      ) : (
                        <div className="font-mono text-sm break-all max-h-24 overflow-y-auto">
                          {item.value}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {editingKey === item.key ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleUpdateItem}
                            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(item.key, item.value)}
                            className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.key)}
                            className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

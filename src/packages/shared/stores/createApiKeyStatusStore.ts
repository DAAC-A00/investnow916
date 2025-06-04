import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type ApiKeyStatus = 'unsaved' | 'verifying' | 'valid' | 'invalid';

type Theme = 'light' | 'dark';

export interface ApiKeyStatusState {
  statuses: Record<string, ApiKeyStatus>;
  error?: string;
  checkApiKey: (key: string) => Promise<boolean>;
  setStatus: (key: string, status: ApiKeyStatus) => void;
  getStatus: (key: string) => ApiKeyStatus | undefined;
  resetStatus: (key: string) => void;
  getStatusIcon: (status: ApiKeyStatus, theme?: Theme) => string;
  getStatusText: (status: ApiKeyStatus, errorType?: string) => string;
}

export const useApiKeyStatusStore = create<ApiKeyStatusState>()(
  devtools(
    immer((set, get) => ({
      statuses: {},

      checkApiKey: async (key: string) => {
        if (!key) {
          set((state) => {
            state.statuses[key] = 'invalid';
          });
          return false;
        }

        try {
          const response = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
          const data = await response.json();
          
          if (data.result === 'success') {
            set((state) => {
              state.statuses[key] = 'valid';
            });
            return true;
          } else {
            set((state) => {
              state.statuses[key] = 'invalid';
              state.error = data['error-type'];
            });
            return false;
          }
        } catch (error) {
          console.error('API Key 검증 중 오류 발생:', error);
          set((state) => {
            state.statuses[key] = 'invalid';
            state.error = 'network-error';
          });
          return false;
        }
      },

      setStatus: (key: string, status: ApiKeyStatus) => {
        set((state) => {
          state.statuses[key] = status;
        });
      },

      getStatus: (key: string) => {
        return get().statuses[key] || 'unsaved';
      },

      resetStatus: (key: string) => {
        set((state) => {
          state.statuses[key] = 'unsaved';
        });
      },

      getStatusIcon: (status: ApiKeyStatus, theme: 'light' | 'dark' = 'light') => {
        switch (status) {
          case 'unsaved':
            return theme === 'dark' ? '⚫' : '⚪';
          case 'verifying':
            return '🟡';
          case 'valid':
            return '🟢';
          case 'invalid':
            return '🔴';
          default:
            return '';
        }
      },

      getStatusText: (status: ApiKeyStatus) => {
        switch (status) {
          case 'unsaved':
            return '미사용';
          case 'verifying':
            return '확인 중';
          case 'valid':
            return '정상';
          case 'invalid':
            if (get().error === 'inactive-account') {
              return '잘못된 API Key이거나 비활성화된 계정입니다.';
            } else if (get().error === 'invalid-key') {
              return '잘못된 API Key입니다. 올바른 API Key를 입력해주세요.';
            } else if (get().error === 'network-error') {
              return 'API 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
            } else if (get().error) {
              return `오류 발생: ${get().error}`;
            }
            return '비정상';
          default:
            return '';
        }
      },
    })),
    {
      name: 'api-key-status-store',
    }
  )
);

// 선택자 함수들
export const useApiKeyStatus = (key: string) => {
  return useApiKeyStatusStore((state) => state.getStatus(key));
};

export const useApiKeyStatusActions = () => {
  return useApiKeyStatusStore((state) => ({
    checkApiKey: state.checkApiKey,
    setStatus: state.setStatus,
    resetStatus: state.resetStatus,
    getStatusIcon: state.getStatusIcon,
    getStatusText: state.getStatusText,
  }));
};

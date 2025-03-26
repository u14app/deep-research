import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { TaskStore } from "./task";
import { researchStore } from "@/utils/storage";
import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";
import { useSettingStore } from "./setting";

type HistoryStore = {
  history: ResearchHistory[];
  isSyncing: boolean;
};

type HistoryFunction = {
  save: (taskStore: TaskStore) => void;
  load: (id: string) => TaskStore | void;
  remove: (id: string) => void;
  syncWithServer: () => Promise<void>;
};

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

export const useHistoryStore = create(
  persist<HistoryStore & HistoryFunction>(
    (set, get) => ({
      history: [],
      isSyncing: false,
      save: (taskStore) => {
        // Only tasks with a title and final report are saved to the history
        if (taskStore.title && taskStore.finalReport) {
          const newHistory: ResearchHistory = {
            id: nanoid(),
            createdAt: Date.now(),
            ...clone(taskStore),
          };
          set((state) => ({ history: [newHistory, ...state.history] }));
          
          // 如果配置了访问密码和同步ID，尝试同步到服务器
          const { accessPassword, syncId } = useSettingStore.getState();
          if (accessPassword && syncId) {
            get().syncWithServer();
          }
        }
      },
      load: (id) => {
        const current = get().history.find((item) => item.id === id);
        if (current) return clone(current);
      },
      remove: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
        
        // 如果配置了访问密码和同步ID，尝试同步到服务器
        const { accessPassword, syncId } = useSettingStore.getState();
        if (accessPassword && syncId) {
          get().syncWithServer();
        }
      },
      syncWithServer: async () => {
        const { accessPassword, syncId } = useSettingStore.getState();
        if (!accessPassword || !syncId) return;
        
        try {
          set({ isSyncing: true });
          
          // 从服务器获取历史记录
          const response = await fetch('/api/sync', {
            method: 'GET',
            headers: {
              'x-access-password': accessPassword,
              'x-sync-id': syncId
            }
          });
          
          if (!response.ok) {
            console.error('Error syncing with server:', await response.text());
            return;
          }
          
          const data = await response.json();
          
          if (data.success && Array.isArray(data.history)) {
            // 合并服务器和本地历史记录
            const serverHistory = data.history;
            const localHistory = get().history;
            
            // 创建一个ID到记录的映射
            const recordMap = new Map<string, ResearchHistory>();
            
            // 先添加本地所有记录
            for (const record of localHistory) {
              recordMap.set(record.id, record);
            }
            
            // 处理服务器记录，解决冲突
            for (const serverRecord of serverHistory) {
              const localRecord = recordMap.get(serverRecord.id);
              
              if (!localRecord) {
                // 如果本地没有此记录，直接添加
                recordMap.set(serverRecord.id, serverRecord);
              } else {
                // 如果本地有此记录，比较创建时间，保留较新的
                if (serverRecord.createdAt > localRecord.createdAt) {
                  recordMap.set(serverRecord.id, serverRecord);
                }
                // 如果本地记录较新，则保持不变
              }
            }
            
            // 将Map转回数组并排序
            const mergedHistory = Array.from(recordMap.values())
              .sort((a, b) => b.createdAt - a.createdAt);
            
            // 更新本地历史记录
            set({ history: mergedHistory });
            
            // 将合并后的历史记录同步到服务器
            await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-access-password': accessPassword,
                'x-sync-id': syncId
              },
              body: JSON.stringify({ history: mergedHistory })
            });
          }
        } catch (error) {
          console.error('Error during history synchronization:', error);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: "historyStore",
      version: 1,
      storage: {
        getItem: async (key: string) => {
          return await researchStore.getItem<
            StorageValue<HistoryStore & HistoryFunction>
          >(key);
        },
        setItem: async (
          key: string,
          store: StorageValue<HistoryStore & HistoryFunction>
        ) => {
          return await researchStore.setItem(key, {
            state: pick(store.state, ["history"]),
            version: store.version,
          });
        },
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);

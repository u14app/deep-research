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
          
          // If configured with access password and sync ID, try to sync to server
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
        
        // If configured with access password and sync ID, try to sync to server
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
          
          // Pull history from server
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
            // Merge history
            const serverHistory = data.history;
            const localHistory = get().history;
            
            // Create a map to store records
            const recordMap = new Map<string, ResearchHistory>();
            
            // Add local records to the map
            for (const record of localHistory) {
              recordMap.set(record.id, record);
            }
            
            // Determine which records need to be added or updated
            for (const serverRecord of serverHistory) {
              const localRecord = recordMap.get(serverRecord.id);
              
              if (!localRecord) {
                recordMap.set(serverRecord.id, serverRecord);
              } else {
                if (serverRecord.createdAt > localRecord.createdAt) {
                  recordMap.set(serverRecord.id, serverRecord);
                }
              }
            }
            
            const mergedHistory = Array.from(recordMap.values())
              .sort((a, b) => b.createdAt - a.createdAt);
            
            set({ history: mergedHistory });
            
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

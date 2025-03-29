import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { TaskStore } from "./task";
import { researchStore } from "@/utils/storage";
import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";
import { toast } from "sonner";
import { syncHistoryWithServer, fetchHistoryFromServer, removeHistoryFromServer } from "@/utils/sync";
import { useSettingStore } from "./setting";

type HistoryStore = {
  history: ResearchHistory[];
  syncInProgress: boolean;
};

type HistoryFunction = {
  save: (taskStore: TaskStore) => string;
  load: (id: string) => TaskStore | void;
  update: (id: string, taskStore: TaskStore) => boolean;
  remove: (id: string) => boolean;
  syncWithServer: () => Promise<boolean>;
};

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

export const useHistoryStore = create(
  persist<HistoryStore & HistoryFunction>(
    (set, get) => ({
      history: [],
      syncInProgress: false,
      save: (taskStore) => {
        // Only tasks with a title and final report are saved to the history
        if (taskStore.title && taskStore.finalReport) {
          const id = nanoid();
          const newHistory: ResearchHistory = {
            ...clone(taskStore),
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          set((state) => ({ history: [newHistory, ...state.history] }));
          
          // Try to sync to server
          const { accessPassword } = useSettingStore.getState();
          if (accessPassword) {
            syncHistoryWithServer(newHistory).then(({ success, error }) => {
              if (!success && error) {
                toast.error(`Saving new history to server failed: ${error}`);
              }
            });
          }
          
          return id;
        }
        return "";
      },
      load: (id) => {
        const current = get().history.find((item) => item.id === id);
        if (current) return clone(current);
      },
      update: (id, taskStore) => {
        const newHistory = get().history.map((item) => {
          if (item.id === id) {
            const updatedRecord = {
              ...clone(taskStore),
              updatedAt: Date.now(),
              createdAt: item.createdAt,
            } as ResearchHistory;
            
            // Try to sync to server
            const { accessPassword } = useSettingStore.getState();
            if (accessPassword) {
              syncHistoryWithServer(updatedRecord).then(({ success, error }) => {
                if (!success && error) {
                  toast.error(`Updating history to server failed: ${error}`);
                }
              });
            }
            
            return updatedRecord;
          } else {
            return item;
          }
        });
        set(() => ({ history: [...newHistory] }));
        return true;
      },
      remove: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
        
        // Try to delete from server
        const { accessPassword } = useSettingStore.getState();
        if (accessPassword) {
          removeHistoryFromServer(id).then(({ success, error }) => {
            if (!success && error) {
              toast.error(`Deleteing history from server failed: ${error}`);
            }
          });
        }
        
        return true;
      },
      syncWithServer: async () => {
        const { accessPassword, syncId } = useSettingStore.getState();
        
        // Check if password and sync ID are configured
        if (!accessPassword || !syncId) {
          toast.error('Configuration error: accessPassword or syncId is not configured');
          return false;
        }
        
        set({ syncInProgress: true });
        
        try {
          const { success, data, error } = await fetchHistoryFromServer();
          
          if (!success || !data) {
            toast.error(`Syncing history failed: ${error}`);
            set({ syncInProgress: false });
            return false;
          }
          
          // Compare and merge records
          const localHistory = get().history;
          const serverMap = new Map(data.map(item => [item.id, item]));
          const localMap = new Map(localHistory.map(item => [item.id, item]));
          const mergedRecords: ResearchHistory[] = [];
          for (const [id, serverRecord] of serverMap.entries()) {
            // Convert createdAt and updatedAt to timestamps
            const parsedRecord = {
              ...serverRecord,
              createdAt: typeof serverRecord.createdAt === 'string'
                ? new Date(serverRecord.createdAt).getTime()
                : serverRecord.createdAt,
              updatedAt: typeof serverRecord.updatedAt === 'string'
                ? new Date(serverRecord.updatedAt).getTime()
                : serverRecord.updatedAt,
              tasks: typeof serverRecord.tasks === 'string'
                ? JSON.parse(serverRecord.tasks)
                : serverRecord.tasks,
              sources: typeof serverRecord.sources === 'string'
                ? JSON.parse(serverRecord.sources)
                : serverRecord.sources,
            };
            
            mergedRecords.push(parsedRecord);
            localMap.delete(id);
          }
          
          // Add remaining local records to the merged list
          for (const [, localRecord] of localMap.entries()) {
            syncHistoryWithServer(localRecord);
            mergedRecords.push(localRecord);
          }
          
          // Sort records by updatedAt in descending order
          mergedRecords.sort((a, b) => {
            const aTime = a.updatedAt || a.createdAt;
            const bTime = b.updatedAt || b.createdAt;
            return bTime - aTime;
          });
          
          set({ history: mergedRecords });
          toast.success('History synced successfully!');
          return true;
        } catch (err) {
          toast.error(`Error when syncing history: ${err instanceof Error ? err.message : 'Unknown error'}`);
          return false;
        } finally {
          set({ syncInProgress: false });
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
            state: pick(store.state, ["history", "syncInProgress"]),
            version: store.version,
          });
        },
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);

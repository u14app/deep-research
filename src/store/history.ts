import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { researchStore } from "@/utils/storage";
import type { TaskStore } from "./task";

export interface ResearchHistory extends TaskStore {
  createdAt: number;
  updatedAt?: number;
}

export interface HistoryStore {
  history: ResearchHistory[];
}

interface HistoryActions {
  save: (taskStore: TaskStore) => string;
  load: (id: string) => TaskStore | undefined;
  update: (id: string, taskStore: TaskStore) => boolean;
  remove: (id: string) => boolean;
}

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

export const useHistoryStore = create(
  persist<HistoryStore & HistoryActions>(
    (set, get) => ({
      history: [],
      save: (taskStore) => {
        // Only tasks with a title and final report are saved to the history
        if (taskStore.title && taskStore.finalReport) {
          const id = nanoid();
          const newHistory: ResearchHistory = {
            ...clone(taskStore),
            id,
            createdAt: Date.now(),
          };
          set((state) => ({ history: [newHistory, ...state.history] }));
          return id;
        }
        return "";
      },
      load: (id) => {
        const current = get().history.find((item) => item.id === id);
        if (current) return clone(current);
        return undefined;
      },
      update: (id, taskStore) => {
        const newHistory = get().history.map((item) => {
          if (item.id === id) {
            return {
              ...clone(taskStore),
              updatedAt: Date.now(),
            } as ResearchHistory;
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
        return true;
      },
    }),
    {
      name: "historyStore",
      version: 1,
      storage: {
        getItem: async (key: string) => {
          return await researchStore.getItem<StorageValue<HistoryStore & HistoryActions>>(key);
        },
        setItem: async (key: string, store: StorageValue<HistoryStore & HistoryActions>) => {
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

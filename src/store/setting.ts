import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingStore {
  apiKey: string;
  apiProxy: string;
  accessPassword: string;
  syncId: string;
  language: string;
}

interface SettingFunction {
  update: (values: Partial<SettingStore>) => void;
}

export const useSettingStore = create(
  persist<SettingStore & SettingFunction>(
    (set) => ({
      apiKey: "",
      apiProxy: "",
      accessPassword: "",
      syncId: "",
      language: "",
      update: (values) => set(values),
    }),
    { name: "setting" }
  )
);

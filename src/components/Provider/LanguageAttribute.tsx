"use client";

import { useEffect } from "react";
import { useSettingStore } from "@/store/setting";

export default function LanguageAttribute() {
  const { language } = useSettingStore();

  useEffect(() => {
    if (language) {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  return null;
} 
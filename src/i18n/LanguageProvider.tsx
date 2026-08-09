"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import translations, { type Language } from "./translations";

const STORAGE_KEY = "portfolio-lang";
const DEFAULT_LANG: Language = "ar";

export type Dictionary = (typeof translations)[Language];

type LanguageContextValue = {
  lang: Language;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyToDocument(lang: Language) {
  document.documentElement.lang = lang;
  document.documentElement.dir = translations[lang].dir;
  document.documentElement.setAttribute("data-lang", lang);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server render + first client paint always use the default (Arabic) so
  // hydration stays consistent; the persisted preference is applied on mount.
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial: Language = saved === "en" || saved === "ar" ? saved : DEFAULT_LANG;
    setLangState(initial);
    applyToDocument(initial);
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyToDocument(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === "ar" ? "en" : "ar";
      localStorage.setItem(STORAGE_KEY, next);
      applyToDocument(next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider
      value={{ lang, dir: translations[lang].dir, t: translations[lang], setLang, toggleLang }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

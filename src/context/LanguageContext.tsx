'use client';

import { createContext, useContext, useState } from 'react';
import ro from '@/locales/ro.json';
import en from '@/locales/en.json';

export type Language = 'ro' | 'en';
const locales = { ro, en };

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof en; // same shape as translation files
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('ro');
  const t = locales[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

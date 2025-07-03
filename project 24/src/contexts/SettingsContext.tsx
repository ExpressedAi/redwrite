import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  autoAnalysis: boolean;
  setAutoAnalysis: (enabled: boolean) => void;
  maxFileSize: number;
  setMaxFileSize: (size: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || 'AIzaSyB1rI6BTg9zvkXZGf9ilNYgFI4WL9eFwkg';
  });
  
  const [openaiApiKey, setOpenaiApiKey] = useState(() => {
    return localStorage.getItem('openai_api_key') || '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';
  });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  
  const [autoAnalysis, setAutoAnalysis] = useState(() => {
    return localStorage.getItem('auto_analysis') === 'true';
  });
  
  const [maxFileSize, setMaxFileSize] = useState(() => {
    return parseInt(localStorage.getItem('max_file_size') || '50');
  });

  useEffect(() => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem('openai_api_key', openaiApiKey);
  }, [openaiApiKey]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('auto_analysis', autoAnalysis.toString());
  }, [autoAnalysis]);

  useEffect(() => {
    localStorage.setItem('max_file_size', maxFileSize.toString());
  }, [maxFileSize]);

  return (
    <SettingsContext.Provider
      value={{
        geminiApiKey,
        setGeminiApiKey,
        openaiApiKey,
        setOpenaiApiKey,
        theme,
        setTheme,
        autoAnalysis,
        setAutoAnalysis,
        maxFileSize,
        setMaxFileSize,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'system' | 'dark' | 'light';

interface ThemeContextValue {
  isDark: boolean;
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  themePref: 'system',
  setThemePref: () => {},
});

const STORAGE_KEY = 'settings.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemePrefState(val);
      }
    });
  }, []);

  const isDark =
    themePref === 'dark' || (themePref === 'system' && systemScheme === 'dark');

  function setThemePref(pref: ThemePref) {
    setThemePrefState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }

  return (
    <ThemeContext.Provider value={{ isDark, themePref, setThemePref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

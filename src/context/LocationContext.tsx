import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_KEY = '@selected_city';
const SAVED_KEY    = '@saved_cities';

interface LocationCtx {
  selectedCity: string;
  savedCities: string[];
  setSelectedCity: (city: string) => void;
  addCity: (city: string) => void;
  removeCity: (city: string) => void;
}

const LocationContext = createContext<LocationCtx>({
  selectedCity: 'Tampa',
  savedCities: ['Tampa'],
  setSelectedCity: () => {},
  addCity: () => {},
  removeCity: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState('Tampa');
  const [savedCities, setSavedCities] = useState<string[]>(['Tampa']);

  useEffect(() => {
    (async () => {
      const [selStr, savedStr] = await Promise.all([
        AsyncStorage.getItem(SELECTED_KEY),
        AsyncStorage.getItem(SAVED_KEY),
      ]);
      if (selStr) setSelectedCityState(selStr);
      if (savedStr) setSavedCities(JSON.parse(savedStr));
    })();
  }, []);

  function setSelectedCity(city: string) {
    const trimmed = city.trim();
    if (!trimmed) return;
    setSelectedCityState(trimmed);
    AsyncStorage.setItem(SELECTED_KEY, trimmed);
    setSavedCities(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }

  function addCity(city: string) {
    const trimmed = city.trim();
    if (!trimmed) return;
    setSavedCities(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }

  function removeCity(city: string) {
    setSavedCities(prev => {
      const next = prev.filter(c => c !== city);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
    if (selectedCity === city) {
      setSavedCities(prev => {
        const remaining = prev.filter(c => c !== city);
        const fallback = remaining[0] ?? 'Tampa';
        setSelectedCityState(fallback);
        AsyncStorage.setItem(SELECTED_KEY, fallback);
        return remaining;
      });
    }
  }

  return (
    <LocationContext.Provider value={{ selectedCity, savedCities, setSelectedCity, addCity, removeCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);

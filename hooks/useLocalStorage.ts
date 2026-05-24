import { useState, useEffect } from 'react';

declare var chrome: any;

// Re-purposing this hook to use chrome.storage.local
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      // Load initial value from chrome storage
      chrome.storage.local.get([key], (result: any) => {
        if (result[key] !== undefined) {
          setStoredValue(result[key]);
        }
        setIsLoaded(true);
      });

      // Listen for changes in other contexts (content script)
      const handleStorageChange = (changes: { [key: string]: any }, areaName: string) => {
        if (areaName === 'local' && changes[key]) {
            setStoredValue(changes[key].newValue);
        }
      };
      
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    } else {
        // Fallback for non-extension environment (dev)
        try {
            const item = window.localStorage.getItem(key);
            if (item) setStoredValue(JSON.parse(item));
        } catch (e) {
            console.warn(e);
        }
        setIsLoaded(true);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: valueToStore });
      } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting storage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}
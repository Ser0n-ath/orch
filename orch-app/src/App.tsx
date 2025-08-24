import React, { useState, createContext, useContext, useEffect } from 'react';
import { StatusBar, LogBox, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

import Navigation from '@/navigation';
import { DarkTheme, LightTheme } from '@/themes/colors';

// Ignore specific warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'VirtualizedLogs should never be nested',
    'Remote debugger',
  ]);
}

// Theme Context
const ThemeContext = createContext({
  isDark: true,
  themeMode: 'system' as 'system' | 'light' | 'dark',
  setThemeMode: (mode: 'system' | 'light' | 'dark') => {},
});

export const useThemeContext = () => useContext(ThemeContext);

// Dark theme using centralized colors
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme,
  },
};

// Light theme using centralized colors  
const lightTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...LightTheme,
  },
};

export default function App() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Determine if we should use dark theme
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const currentTheme = isDark ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['system', 'light', 'dark'].includes(savedTheme)) {
          setThemeMode(savedTheme as 'system' | 'light' | 'dark');
        }
      } catch (error) {
        // Silently fail, use default
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  const handleThemeModeChange = async (mode: 'system' | 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeMode(mode);
    } catch (error) {
      setThemeMode(mode); // Set anyway
    }
  };

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode: handleThemeModeChange }}>
      <PaperProvider theme={currentTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar 
              barStyle={isDark ? "light-content" : "dark-content"}
              backgroundColor={currentTheme.colors.background}
            />
            <Navigation />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
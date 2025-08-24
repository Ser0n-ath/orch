// Centralized Color System for Orchestra App

export const Colors = {
  // Base palette - your specified colors
  warmBeige: '#f8f6f4',
  warmCream: '#fbf5e8',
  pureBlack: '#000000',
  pureWhite: '#ffffff',
  
  // Gray scale
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Semantic colors
  error: '#d32f2f',
  success: '#2e7d32',
  warning: '#f57c00',
};

// Dark Theme Colors
export const DarkTheme = {
  // Surfaces
  background: Colors.pureBlack,
  surface: '#111111',
  surfaceVariant: '#1a1a1a',
  surfaceContainer: '#1e1e1e',
  
  // Primary colors
  primary: Colors.warmBeige,
  onPrimary: Colors.pureBlack,
  primaryContainer: '#3700B3',
  onPrimaryContainer: Colors.pureWhite,
  
  // Secondary colors
  secondary: Colors.warmCream,
  onSecondary: Colors.pureBlack,
  secondaryContainer: '#018786',
  onSecondaryContainer: Colors.pureWhite,
  
  // Text colors
  onBackground: Colors.pureWhite,
  onSurface: Colors.pureWhite,
  onSurfaceVariant: Colors.gray300,
  
  // Borders & outlines
  outline: Colors.gray700,
  outlineVariant: '#1f1f1f',
  
  // Status colors
  error: '#ff6b6b',
  onError: Colors.pureBlack,
  errorContainer: '#B00020',
  onErrorContainer: Colors.pureWhite,
};

// Light Theme Colors
export const LightTheme = {
  // Surfaces
  background: Colors.warmBeige,
  surface: Colors.pureWhite,
  surfaceVariant: Colors.gray50,
  surfaceContainer: Colors.gray100,
  
  // Primary colors
  primary: Colors.pureBlack,
  onPrimary: Colors.pureWhite,
  primaryContainer: Colors.gray200,
  onPrimaryContainer: Colors.pureBlack,
  
  // Secondary colors
  secondary: Colors.gray700,
  onSecondary: Colors.pureWhite,
  secondaryContainer: Colors.gray100,
  onSecondaryContainer: Colors.pureBlack,
  
  // Text colors
  onBackground: Colors.pureBlack,
  onSurface: Colors.pureBlack,
  onSurfaceVariant: Colors.gray600,
  
  // Borders & outlines
  outline: Colors.gray300,
  outlineVariant: Colors.gray200,
  
  // Status colors
  error: Colors.error,
  onError: Colors.pureWhite,
  errorContainer: '#ffebee',
  onErrorContainer: Colors.error,
};

// Export themed color objects for easy use
export const getThemeColors = (isDark: boolean) => {
  return isDark ? DarkTheme : LightTheme;
};

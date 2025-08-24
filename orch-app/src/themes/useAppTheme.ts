import { useTheme } from 'react-native-paper';
import { useThemeContext } from '../App';
import { getThemeColors, Colors } from './colors';

export const useAppTheme = () => {
  const paperTheme = useTheme();
  const { isDark } = useThemeContext();
  
  // Get our centralized colors
  const colors = getThemeColors(isDark);
  
  return {
    // Paper theme (for Paper components)
    paper: paperTheme,
    
    // Our centralized colors
    colors,
    
    // Base color palette (always available)
    palette: Colors,
    
    // Theme state
    isDark,
    
    // Convenience methods
    surface: {
      primary: colors.surface,
      secondary: colors.surfaceVariant,
      elevated: colors.surfaceContainer,
    },
    
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
      onPrimary: colors.onPrimary,
    },
    
    border: {
      default: colors.outline,
      subtle: colors.outlineVariant,
    },
  };
};

export default useAppTheme;

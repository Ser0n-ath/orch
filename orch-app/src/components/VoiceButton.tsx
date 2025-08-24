import React, { useState } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface VoiceButtonProps {
  onResult: (result: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onResult, disabled = false }: VoiceButtonProps) {
  const [scaleAnim] = useState(new Animated.Value(1));
  const theme = useTheme();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      // Demo voice functionality
      const demoQueries = [
        "Show me my recent orders",
        "What's the weather like today?",
        "Find my flight information",
        "Check my account balance",
        "Book a table for dinner"
      ];
      const randomQuery = demoQueries[Math.floor(Math.random() * demoQueries.length)];
      onResult(randomQuery);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            opacity: disabled ? 0.5 : 1,
          }
        ]}
      >
        <Text style={[styles.icon, { color: theme.colors.onPrimary }]}>
          🎤
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 32,
  },
});
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
} from 'react-native-paper';
import useAppTheme from '../themes/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppStore } from '@/store/useAppStore';
import { useOrchestraApi } from '@/hooks/useOrchestraApi';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { addToHistory, setCurrentJobId } = useAppStore();
  const { submitQuery, error: apiError, clearError } = useOrchestraApi();



  const handleSubmit = async () => {
    if (!query.trim()) return;

    setLoading(true);
    clearError(); // Clear any previous errors
    
    try {
      // Add to history immediately
      const historyId = addToHistory({
        query,
        mode,
        status: 'in-progress',
      });

      // Submit query to real API
      const jobId = await submitQuery({ query, mode });
      
      if (jobId) {
        setCurrentJobId(jobId);
        
        // Update history with job ID
        // Note: You might want to add an updateHistoryItem method to your store
        
        // Navigate to result screen
        (navigation as any).navigate('Result', {
          jobId,
          query
        });
      } else {
        // Handle API error
        Alert.alert('Error', 'Failed to submit query. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };





  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Orchestra
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Your AI assistant for everything
            </Text>
          </View>
        </View>

        {/* Error Display */}
        {apiError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {apiError}
            </Text>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <Text style={[styles.errorCloseText, { color: theme.colors.onErrorContainer }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input Bar */}
        <View style={[styles.bottomInputContainer, { backgroundColor: theme.colors.background }]}>
                 <View style={styles.inputRow}>
           <View style={styles.textInputContainer}>
             <TextInput
               mode="outlined"
               label="Ask Orchestra anything..."
               placeholder="Type your message..."
               value={query}
               onChangeText={setQuery}
               multiline
               maxLength={500}
               style={query.trim() ? styles.bottomTextInputWithButton : styles.bottomTextInputFull}
               disabled={loading}
               contentStyle={styles.textInputContent}
               outlineStyle={styles.textInputOutline}
               theme={{
                 colors: {
                   primary: theme.colors.primary,
                   outline: theme.colors.outline,
                   onSurfaceVariant: theme.colors.onSurfaceVariant,
                 },
                 roundness: 16,
               }}
             />
             {query.trim() ? (
               <TouchableOpacity 
                 style={styles.clearButton}
                 onPress={() => setQuery('')}
               >
                 <Text style={[styles.clearButtonText, { color: theme.colors.onSurfaceVariant }]}>
                   ✕
                 </Text>
               </TouchableOpacity>
             ) : null}
           </View>
           {query.trim() ? (
             <TouchableOpacity
               onPress={handleSubmit}
               disabled={loading}
               style={[
                 styles.sendIconButton, 
                 { 
                   backgroundColor: theme.colors.primary,
                   opacity: loading ? 0.5 : 1
                 }
               ]}
             >
               <Text style={[styles.sendIcon, { color: theme.colors.onPrimary }]}>
                 ➤
               </Text>
             </TouchableOpacity>
           ) : null}
         </View>
        {query.length > 0 && (
          <View style={styles.characterCounter}>
            <Text variant="bodySmall" style={[styles.counterText, { color: theme.colors.onSurfaceVariant }]}>
              {query.length}/500
            </Text>
          </View>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  bottomInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomTextInputFull: {
    maxHeight: 120,
    minHeight: 64,
    flex: 1,
  },
  bottomTextInputWithButton: {
    maxHeight: 120,
    minHeight: 64,
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textInputContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textInputOutline: {
    borderRadius: 16,
    borderWidth: 2,
  },
  sendIconButton: {
    width: 64,
    height: 56,
    borderRadius: 16,
    margin: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  characterCounter: {
    alignItems: 'flex-end',
    marginTop: 8,
    paddingRight: 12,
  },
  counterText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  errorCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
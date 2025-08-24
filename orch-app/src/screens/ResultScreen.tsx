import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import useAppTheme from '../themes/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import { useAppStore } from '@/store/useAppStore';
import { useOrchestraApi } from '@/hooks/useOrchestraApi';
import { JobStatus } from '@/services/orchestraApi';

// Helper function to render BatonCore automation results
const renderBatonCoreResult = (result: any, theme: any) => {
  if (!result) return null;


  
  // Check if this is a BatonCore response with automation results
  if (result.success && result.result) {
    const automationResult = result.result;
    
    return (
      <View style={{ marginTop: 8 }}>
        <Text variant="bodyLarge" style={[{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 8 }]}>
          🤖 Automation Completed Successfully
        </Text>
        
        {/* Show the prompt that was executed */}
        {result.prompt && (
          <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
            <Text variant="bodySmall" style={[{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }]}>
              Task:
            </Text>
            <Text variant="bodyMedium" style={[{ color: theme.colors.onSurface }]}>
              {result.prompt}
            </Text>
          </View>
        )}

        {/* Highlight the final extracted result */}
        {automationResult.outputs && automationResult.outputs.length > 0 && (
          (() => {
            // Find the final result (usually the last output or one with ** formatting)
            const finalResult = automationResult.outputs.find((output: string) => 
              output.includes('**') || output.toLowerCase().includes('title') || output.toLowerCase().includes('story')
            ) || automationResult.outputs[automationResult.outputs.length - 1];
            
            if (finalResult && finalResult.length > 20) {
              return (
                <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 8 }}>
                  <Text variant="bodySmall" style={[{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }]}>
                    🎯 Extracted Result:
                  </Text>
                  <Text variant="bodyMedium" style={[{ color: theme.colors.onSurface, fontWeight: '600' }]}>
                    {finalResult.replace(/^\w+\([^)]*\)\s*/, '').replace(/^•\s*/, '')}
                  </Text>
                </View>
              );
            }
            return null;
          })()
        )}

        {/* Show execution plan if available */}
        {automationResult.plan && automationResult.plan.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text variant="bodyMedium" style={[{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 8 }]}>
              📋 Execution Plan:
            </Text>
            {automationResult.plan.slice(0, 3).map((step: any, index: number) => (
              <Text key={index} variant="bodySmall" style={[{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }]}>
                {index + 1}. {step.name}: {step.query}
              </Text>
            ))}
            {automationResult.plan.length > 3 && (
              <Text variant="bodySmall" style={[{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                ... and {automationResult.plan.length - 3} more steps
              </Text>
            )}
          </View>
        )}

        {/* Show key outputs */}
        {automationResult.outputs && automationResult.outputs.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text variant="bodyMedium" style={[{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 8 }]}>
              📊 Results:
            </Text>
            {automationResult.outputs.map((output: string, index: number) => {
              // Check if this output contains the final extracted result
              const isExtractedResult = output.includes('**') || output.includes('title') || output.includes('story') || index === automationResult.outputs.length - 1;
              
              return (
                <View key={index} style={{ marginBottom: 6 }}>
                  <Text 
                    variant={isExtractedResult ? "bodyMedium" : "bodySmall"} 
                    style={[{ 
                      color: isExtractedResult ? theme.colors.primary : theme.colors.onSurfaceVariant, 
                      marginBottom: 4,
                      fontWeight: isExtractedResult ? '600' : 'normal',
                      lineHeight: 20
                    }]}
                  >
                    • {output}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Show screenshots count if available */}
        {automationResult.screenshots && automationResult.screenshots.length > 0 && (
          <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 6 }}>
            <Text variant="bodySmall" style={[{ color: theme.colors.onSurface }]}>
              📸 {automationResult.screenshots.length} screenshots captured during execution
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Fallback for other result types
  return (
    <Text variant="bodyLarge" style={[{ color: theme.colors.onSurface }]}>
      {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
    </Text>
  );
};

export default function ResultScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Processing...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const theme = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { updateHistoryStatus } = useAppStore();
  const { getJobStatus, getJobResult, error: apiError, clearError } = useOrchestraApi();
  
  const params = route.params as { jobId?: string; query?: string } | undefined;
  const { jobId, query } = params || {};

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const pollJobStatus = async () => {
      if (!jobId) return;
      
      try {
        const status = await getJobStatus(jobId);
        if (status) {
          setJobStatus(status);
          setProgress(status.progress / 100);
          
          // Update status text based on job status
          switch (status.status) {
            case 'pending':
              setStatus('Queued for processing...');
              break;
            case 'processing':
              setStatus(status.message || 'Processing your request...');
              break;
            case 'completed':
              setStatus('Completed successfully!');
              setIsCompleted(true);
              if (jobId) updateHistoryStatus(jobId, 'completed');
              
              // Get the final result
              if (jobId) {
                try {
                  const finalResult = await getJobResult(jobId);
                  setResult(finalResult);
                } catch (error) {
                  console.error('Failed to get result:', error);
                }
              }
              
              clearInterval(interval);
              return;
            case 'failed':
              setStatus('Failed to process request');
              setIsCompleted(true);
              if (jobId) updateHistoryStatus(jobId, 'error');
              clearInterval(interval);
              return;
          }
        }
      } catch (error) {
        console.error('Failed to get job status:', error);
        setStatus('Error checking status');
      }
    };

    // Poll every 2 seconds
    interval = setInterval(pollJobStatus, 2000);
    
    // Initial check
    pollJobStatus();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [jobId, updateHistoryStatus, getJobStatus, getJobResult]);

  const handleNewQuery = () => {
    (navigation as any).navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Query Display */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Your Request
            </Text>
            <Text variant="bodyLarge" style={[styles.queryText, { color: theme.colors.onSurface }]}>
              {query}
            </Text>
          </Card.Content>
        </Card>

        {/* Progress Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.statusHeader}>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Execution Status
              </Text>
              <Chip 
                mode="outlined"
                textStyle={{ 
                  color: isCompleted ? theme.colors.primary : theme.colors.secondary,
                  fontWeight: '600' 
                }}
                style={{ 
                  borderColor: isCompleted ? theme.colors.primary : theme.colors.secondary 
                }}
              >
                {isCompleted ? 'Completed' : 'In Progress'}
              </Chip>
            </View>
            
            <Text variant="bodyMedium" style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
              {status}
            </Text>
            
            <ProgressBar 
              progress={progress} 
              style={styles.progressBar}
              color={theme.colors.primary}
            />
            
            <Text variant="bodySmall" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
              {Math.round(progress * 100)}% complete
            </Text>
          </Card.Content>
        </Card>

        {/* Results Section */}
        {isCompleted && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Result
              </Text>
              <View style={styles.resultContainer}>
                {result ? (
                  <>
                    <Text style={styles.resultIcon}>✅</Text>
                    {renderBatonCoreResult(result, theme)}
                  </>
                ) : (
                  <>
                    <Text style={styles.resultIcon}>✅</Text>
                    <Text variant="bodyLarge" style={[styles.resultText, { color: theme.colors.onSurface }]}>
                      Your request has been processed successfully! The results have been prepared and are ready for review.
                    </Text>
                  </>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Error Display */}
        {apiError && (
          <Card style={[styles.card, { borderColor: theme.colors.error, borderWidth: 1 }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.error }]}>
                API Error
              </Text>
              <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                {apiError}
              </Text>
              <Button 
                mode="outlined" 
                onPress={clearError}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textColor={theme.colors.error}
              >
                Dismiss
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button 
            mode="outlined" 
            onPress={handleNewQuery}
            style={styles.actionButton}
          >
            New Query
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  queryText: {
    lineHeight: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 12,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 16,
    lineHeight: 20,
  },
});
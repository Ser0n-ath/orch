import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';
import useAppTheme from '../themes/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';

export default function HistoryScreen() {
  const theme = useAppTheme();
  const { history, clearHistory } = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'in-progress':
        return theme.colors.secondary;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <Card style={[styles.historyCard, { backgroundColor: theme.surface.primary }]}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Chip 
            mode="outlined"
            textStyle={[styles.chipText, { color: getStatusColor(item.status) }]}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Chip>
          <Text variant="bodySmall" style={{ color: theme.text.secondary }}>
            {item.mode === 'voice' ? '🎤' : '⌨️'}
          </Text>
        </View>
        <Text variant="bodyLarge" style={[styles.queryText, { color: theme.text.primary }]}>
          {item.query}
        </Text>
        <Text variant="bodySmall" style={[styles.timestamp, { color: theme.text.secondary }]}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.text.primary }]}>
        No history yet
      </Text>
      <Text variant="bodyLarge" style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        Your completed requests will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.text.primary }]}>
          History
        </Text>
        {history.length > 0 && (
          <Button mode="outlined" onPress={clearHistory} compact>
            Clear All
          </Button>
        )}
      </View>
      
      <Divider />
      
      {history.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
  },
  historyCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  queryText: {
    marginBottom: 8,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
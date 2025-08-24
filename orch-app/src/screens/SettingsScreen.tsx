import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  Text as PaperText,
  Card,
  List,
  Button,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../App';
import useAppTheme from '../themes/useAppTheme';
import { useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useThemeContext();
  const theme = useAppTheme();
  const systemColorScheme = useColorScheme();

  const handleNotificationsToggle = () => {
    // Handle notifications toggle
  };

  const handlePrivacySettings = () => {
    // Handle privacy settings
  };

  const handleAbout = () => {
    // Handle about
  };

  const handleLogout = () => {
    // Handle logout
  };

  // Removed debug function

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <Card style={[styles.card, { backgroundColor: theme.surface.primary }]}>
          <Card.Content style={styles.appInfo}>
            <PaperText variant="headlineSmall" style={[styles.appName, { color: theme.text.primary }]}>
              Orchestra
            </PaperText>
            <PaperText variant="bodyMedium" style={[styles.appVersion, { color: theme.text.secondary }]}>
              Version 1.0.0
            </PaperText>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface.primary }]}>
          <Card.Content>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Appearance
            </PaperText>
          </Card.Content>
          
          <List.Item
            title="Theme"
            description="Choose your preferred theme"
          />
          
          <View style={styles.themeOptions}>
            <List.Item
              title="System Default"
              description={`Follow device settings (currently ${systemColorScheme === 'dark' ? 'dark' : 'light'})`}
              left={() => (
                <RadioButton
                  value="system"
                  status={themeMode === 'system' ? 'checked' : 'unchecked'}
                  onPress={() => setThemeMode('system')}
                />
              )}
              right={() => (
                <MaterialIcons 
                  name={systemColorScheme === 'dark' ? 'dark-mode' : 'light-mode'} 
                  size={20} 
                  color={theme.text.secondary} 
                />
              )}
              onPress={() => setThemeMode('system')}
            />
            
            <List.Item
              title="Light Mode"
              description="Always use light theme"
              left={() => (
                <RadioButton
                  value="light"
                  status={themeMode === 'light' ? 'checked' : 'unchecked'}
                  onPress={() => setThemeMode('light')}
                />
              )}
              right={() => (
                <MaterialIcons 
                  name="light-mode" 
                  size={20} 
                  color={theme.text.secondary} 
                />
              )}
              onPress={() => setThemeMode('light')}
            />
            
            <List.Item
              title="Dark Mode"
              description="Always use dark theme"
              left={() => (
                <RadioButton
                  value="dark"
                  status={themeMode === 'dark' ? 'checked' : 'unchecked'}
                  onPress={() => setThemeMode('dark')}
                />
              )}
              right={() => (
                <MaterialIcons 
                  name="dark-mode" 
                  size={20} 
                  color={theme.text.secondary} 
                />
              )}
              onPress={() => setThemeMode('dark')}
            />
          </View>
        </Card>

        {/* Other Settings */}
        <Card style={[styles.card, { backgroundColor: theme.surface.primary }]}>
          <Card.Content>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Settings
            </PaperText>
          </Card.Content>
          
          <List.Item
            title="Notifications"
            description="Manage notification preferences"
            left={() => (
              <MaterialIcons 
                name="notifications" 
                size={24} 
                color={theme.text.secondary} 
                style={styles.listIcon}
              />
            )}
            onPress={handleNotificationsToggle}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy & Security"
            description="Data usage and privacy settings"
            left={() => (
              <MaterialIcons 
                name="security" 
                size={24} 
                color={theme.text.secondary} 
                style={styles.listIcon}
              />
            )}
            onPress={handlePrivacySettings}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            description="App information and credits"
            left={() => (
              <MaterialIcons 
                name="info" 
                size={24} 
                color={theme.text.secondary} 
                style={styles.listIcon}
              />
            )}
            onPress={handleAbout}
          />
        </Card>

        {/* Account */}
        <Card style={[styles.card, { backgroundColor: theme.surface.primary }]}>
          <Card.Content style={styles.cardContent}>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Account
            </PaperText>
          </Card.Content>
          
          <List.Item
            title="Sign Out"
            description="Sign out of your account"
            left={() => (
              <MaterialIcons 
                name="logout" 
                size={24} 
                color={theme.colors.error} 
                style={styles.listIcon}
              />
            )}
            titleStyle={{ color: theme.colors.error }}
            onPress={handleLogout}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <PaperText variant="bodySmall" style={[styles.footerText, { color: theme.text.secondary }]}>
            Orchestra
          </PaperText>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  themeOptions: {
    paddingLeft: 16,
  },
  themeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  listIcon: {
    alignSelf: 'center',
    marginLeft: 16,
    marginRight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    textAlign: 'center',
  },
});
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, MainTabParamList } from '@/types';
import HomeScreen from '@/screens/HomeScreen';
import ResultScreen from '@/screens/ResultScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainTabParamList>();

function MainDrawer() {
  const theme = useTheme();
  
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerPosition: 'left',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Orchestra',
          drawerIcon: ({ focused, size }) => (
            <MaterialIcons 
              name="home" 
              size={size} 
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
          ),
        }}
      />
      <Drawer.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          title: 'History',
          drawerIcon: ({ focused, size }) => (
            <MaterialIcons 
              name="history" 
              size={size} 
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          drawerIcon: ({ focused, size }) => (
            <MaterialIcons 
              name="settings" 
              size={size} 
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function Navigation() {
  const theme = useTheme();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainDrawer} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ 
            title: 'Execution Progress',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { gameColors } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import QuizSearchScreen from '../screens/QuizSearchScreen';
import QuizGameScreen from '../screens/QuizGameScreen';
import QuizSubmitScreen from '../screens/QuizSubmitScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import AdminScreen from '../screens/AdminScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Game') {
              iconName = focused ? 'game-controller' : 'game-controller-outline';
            } else if (route.name === 'Submit') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Scoreboard') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'Admin') {
              iconName = focused ? 'construct' : 'construct-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: gameColors.primary.solid,
          tabBarInactiveTintColor: gameColors.gray[400],
          headerStyle: {
            backgroundColor: gameColors.primary.solid,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '홈' }}
        />
        <Tab.Screen 
          name="Search" 
          component={QuizSearchScreen} 
          options={{ title: '퀴즈 검색' }}
        />
        <Tab.Screen 
          name="Game" 
          component={QuizGameScreen} 
          options={{ title: '퀴즈 맞추기' }}
        />
        <Tab.Screen 
          name="Submit" 
          component={QuizSubmitScreen} 
          options={{ title: '퀴즈 등록' }}
        />
        <Tab.Screen 
          name="Scoreboard" 
          component={ScoreboardScreen} 
          options={{ title: '스코어보드' }}
        />
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{ title: '관리자' }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: '설정' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
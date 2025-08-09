import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SoundProvider } from './src/contexts/SoundContext';

export default function App() {
  return (
    <SoundProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SoundProvider>
  );
}

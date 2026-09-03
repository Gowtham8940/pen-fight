import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import { GameScreen } from '../../screens/Game/GameScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';
import { SkinSelectScreen } from '../../screens/SkinSelect/SkinSelectScreen';
import { CareerScreen } from '../../screens/Career/CareerScreen';
import { useTheme } from '../../ui/theme/useTheme';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        // Every screen draws its own compact header (ui/ScreenHeader) inside
        // its scroll content, so nothing can slide under the back control.
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name={Routes.Home} component={HomeScreen} />
      <Stack.Screen name={Routes.Game} component={GameScreen} />
      <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
      <Stack.Screen name={Routes.SkinSelect} component={SkinSelectScreen} />
      <Stack.Screen name={Routes.Career} component={CareerScreen} />
    </Stack.Navigator>
  );
}

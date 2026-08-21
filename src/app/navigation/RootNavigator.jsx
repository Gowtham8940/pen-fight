import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import { GameScreen } from '../../screens/Game/GameScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';
import { SkinSelectScreen } from '../../screens/SkinSelect/SkinSelectScreen';
import { StreakScreen } from '../../features/streaks/StreakScreen';
import { LeaderboardScreen } from '../../screens/Leaderboard/LeaderboardScreen';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';
import { useTheme } from '../../ui/theme/useTheme';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text },
        headerTintColor: theme.colors.brand,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name={Routes.Home} component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name={Routes.Game}
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={Routes.Settings} component={SettingsScreen} options={{ title: '' }} />
      <Stack.Screen name={Routes.SkinSelect} component={SkinSelectScreen} options={{ title: '' }} />
      <Stack.Screen name={Routes.Streak} component={StreakScreen} options={{ title: '' }} />
      <Stack.Screen name={Routes.Leaderboard} component={LeaderboardScreen} options={{ title: '' }} />
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

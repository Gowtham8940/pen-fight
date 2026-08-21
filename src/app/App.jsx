import React, { useState } from 'react';
import { Linking, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';

import i18n from '../i18n';
import { ThemeProvider } from './providers/ThemeProvider';
import { useTheme } from '../ui/theme/useTheme';
import { RootNavigator } from './navigation/RootNavigator';
import { AnimatedSplash } from '../ui/AnimatedSplash';
import { UpdatePrompt } from '../ui/UpdatePrompt';
import { MaintenanceScreen } from '../screens/Maintenance/MaintenanceScreen';
import { APP_STATUS } from '../config/appStatus';
import { storage, StorageKeys, getString } from '../lib/storage';

function buildNavTheme(theme) {
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.brand,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };
}

function AppInner() {
  const theme = useTheme();
  return (
    <>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer theme={buildNavTheme(theme)}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

/** Gates the app behind maintenance / update / splash. Lives inside the theme
 *  + i18n providers so those screens are themed and translated. */
function AppGate() {
  const [splashDone, setSplashDone] = useState(false);
  const [maintenance, setMaintenance] = useState(APP_STATUS.maintenance);
  const [showUpdate, setShowUpdate] = useState(() => {
    const u = APP_STATUS.update;
    if (!u.available) return false;
    if (u.required) return true;
    return getString(StorageKeys.skippedUpdate, '') !== u.version;
  });

  if (maintenance) {
    return <MaintenanceScreen onRetry={() => setMaintenance(APP_STATUS.maintenance)} />;
  }

  const onUpdate = () => Linking.openURL(APP_STATUS.update.storeUrl).catch(() => {});
  const onSkip = () => {
    storage.set(StorageKeys.skippedUpdate, APP_STATUS.update.version);
    setShowUpdate(false);
  };

  return (
    <>
      <AppInner />
      {splashDone && showUpdate && (
        <UpdatePrompt
          visible
          required={APP_STATUS.update.required}
          onUpdate={onUpdate}
          onSkip={onSkip}
        />
      )}
      {!splashDone && <AnimatedSplash onDone={() => setSplashDone(true)} />}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            <AppGate />
          </I18nextProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

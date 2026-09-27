import { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide the native splash screen as soon as the app mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return <Slot />;
}

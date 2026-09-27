import React from 'react';
import { Platform, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import App from '@/App';

export default function AppEntry() {
  if (Platform.OS === 'web') {
    return <App />;
  }

  // Determine host IP and port from Expo Go debugger / connection
  const hostUri = Constants.expoConfig?.hostUri || '';
  const hostIp = hostUri ? hostUri.split(':')[0] : '192.168.1.12';
  const port = hostUri && hostUri.includes(':') ? hostUri.split(':')[1] : '8081';
  const appUrl = `http://${hostIp}:${port}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <WebView
          source={{ uri: appUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          originWhitelist={['*']}
          allowsInlineMediaPlayback={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E2BB8" />
              <Text style={styles.loadingText}>Loading aaspaas...</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});

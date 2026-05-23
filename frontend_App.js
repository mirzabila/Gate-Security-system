// App.js  — root entry point
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar }  from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

import { store, setUser, setToken } from './src/store';
import AppNavigator   from './src/navigation/AppNavigator';
import GateAlertModal from './src/components/GateAlertModal';
import { AuthAPI }    from './src/services/api';
import useWebSocket   from './src/hooks/useWebSocket';
import useNotifications, { registerForPushNotificationsAsync } from './src/hooks/useNotifications';

function AppContent() {
  const dispatch = useDispatch();
  useWebSocket();
  useNotifications();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      try {
        dispatch(setToken(token));
        const res = await AuthAPI.me();
        dispatch(setUser({ id: res.data.id, name: res.data.name, role: res.data.role }));
      } catch (_) {
        await SecureStore.deleteItemAsync('token');
      }
    })();
    registerForPushNotificationsAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0A1628" />
      <AppNavigator />
      <GateAlertModal />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

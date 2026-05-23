// src/hooks/useNotifications.js
import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useDispatch } from 'react-redux';
import { setActiveAlert, prependEvent } from '../store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gate-alerts', {
      name:              'Gate Alerts',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 500, 200, 500, 200, 500],
      lightColor:        '#00C8DC',
      sound:             'gate_alert.wav',
      enableVibrate:     true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (_) {
    return null;
  }
}

export default function useNotifications() {
  const dispatch         = useDispatch();
  const foregroundRef    = useRef(null);
  const responseRef      = useRef(null);

  useEffect(() => {
    // Foreground notifications → trigger gate alert modal
    foregroundRef.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.type === 'GATE_ALERT') {
        dispatch(setActiveAlert(data));
        dispatch(prependEvent({
          id:           data.event_id,
          message:      data.message,
          triggered_by: data.triggered_by,
          created_at:   data.timestamp,
          acknowledged: false,
        }));
      }
    });

    // Background tap → navigate / acknowledge
    responseRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'GATE_ALERT') {
        dispatch(setActiveAlert(data));
      }
    });

    return () => {
      if (foregroundRef.current) Notifications.removeNotificationSubscription(foregroundRef.current);
      if (responseRef.current)   Notifications.removeNotificationSubscription(responseRef.current);
    };
  }, [dispatch]);
}

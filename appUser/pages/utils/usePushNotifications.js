import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import appConfig from '../../app.json';
import { api } from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function usePushNotifications(userId, onNotificationResponse) {
  const tokenRef = useRef(null);
  const responseHandler = useRef(onNotificationResponse);
  responseHandler.current = onNotificationResponse;

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return undefined;
    let mounted = true;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      responseHandler.current?.();
    });

    async function registerDevice() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('rides', {
            name: 'Atualizações do InteriorGo',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) return;

        const projectId = appConfig.extra?.eas?.projectId;
        if (!projectId) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (!mounted || !token) return;
        tokenRef.current = token;
        await api.post('/notifications/token', { token, platform: Platform.OS });
      } catch (_error) {
        // Push é complementar: uma falha de configuração não deve bloquear o app nem a corrida.
      }
    }

    registerDevice();
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (mounted && response) responseHandler.current?.();
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});

    return () => {
      mounted = false;
      responseSubscription.remove();
    };
  }, [userId]);

  return useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      await api.delete('/notifications/token', { token });
    } catch (_error) {
      // O logout local ainda deve terminar se o dispositivo estiver sem conexão.
    } finally {
      tokenRef.current = null;
    }
  }, []);
}

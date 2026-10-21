import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';

const MINIMUM_SEND_INTERVAL_MS = 10000;
const MINIMUM_SEND_DISTANCE_METERS = 20;

function distanceMeters(first, second) {
  const latitudeScale = 111320;
  const longitudeScale = latitudeScale * Math.cos((first.latitude * Math.PI) / 180);
  return Math.hypot(
    (second.latitude - first.latitude) * latitudeScale,
    (second.longitude - first.longitude) * longitudeScale,
  );
}

export default function useRideLocationShare({ rideId, status, type, setSession }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!rideId || status !== 'EmAndamento') {
      setMessage('');
      return undefined;
    }

    let active = true;
    let starting = false;
    let sending = false;
    let subscription = null;
    let lastSentAt = 0;
    let lastSentPosition = null;

    function stopWatching() {
      subscription?.remove();
      subscription = null;
    }

    async function startWatching() {
      if (!active || starting || subscription || AppState.currentState !== 'active') return;
      starting = true;
      setMessage('Verificando permissão de localização…');

      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) {
          setMessage('Localização não compartilhada: permita o acesso à localização durante o uso do app.');
          return;
        }
        if (AppState.currentState !== 'active') return;

        subscription = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: MINIMUM_SEND_INTERVAL_MS,
          distanceInterval: MINIMUM_SEND_DISTANCE_METERS,
        }, (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const now = Date.now();
          if (sending) return;
          if (lastSentPosition
            && now - lastSentAt < MINIMUM_SEND_INTERVAL_MS
            && distanceMeters(lastSentPosition, next) < MINIMUM_SEND_DISTANCE_METERS) return;

          sending = true;
          lastSentAt = now;
          lastSentPosition = next;
          api.post('/corridas/' + rideId + '/localizacao', next)
            .then(({ data }) => {
              if (!active) return;
              setSession((current) => {
                if (current.activeRide?.corrida?.corridaId !== rideId) return current;
                const field = type === 'Motorista' ? 'localizacaoMotorista' : 'localizacaoPassageiro';
                return {
                  ...current,
                  activeRide: {
                    ...current.activeRide,
                    [field]: data,
                    ...(type === 'Motorista' ? { localizacao: data } : {}),
                  },
                };
              });
              setMessage('Compartilhando a posição enquanto o app está aberto.');
            })
            .catch(() => {
              if (active) setMessage('Sem conexão com o servidor. A posição será enviada quando a conexão voltar.');
            })
            .finally(() => { sending = false; });
        });

        if (!active || AppState.currentState !== 'active') {
          stopWatching();
          return;
        }
        setMessage('Compartilhando a posição enquanto o app está aberto.');
      } catch (_error) {
        if (active) setMessage('Sinal de localização indisponível. O app tentará novamente ao voltar ao primeiro plano.');
      } finally {
        starting = false;
      }
    }

    const appStateListener = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        startWatching();
      } else {
        stopWatching();
        setMessage('Compartilhamento pausado em segundo plano para economizar bateria.');
      }
    });

    startWatching();
    return () => {
      active = false;
      appStateListener.remove();
      stopWatching();
    };
  }, [rideId, setSession, status, type]);

  return message;
}

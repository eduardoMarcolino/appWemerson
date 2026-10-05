import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function SearchingDriver({ go, session, setSession }) {
  const [error, setError] = useState('');
  const notifiedStatus = useRef(session.activeRide?.corrida?.status);
  const canNotify = useRef(false);
  const rideId = session.activeRide?.corrida?.corridaId;
  const ride = session.activeRide?.corrida;
  const driver = session.activeRide?.motorista;

  useEffect(() => {
    if (!rideId) {
      setError('Não foi possível identificar a corrida.');
      return undefined;
    }

    let mounted = true;
    async function refreshRide() {
      try {
        const { data } = await api.get(`/corridas/${rideId}`);
        if (!mounted) return;
        setSession((current) => ({ ...current, activeRide: data }));
        const status = data.corrida.status;
        if (status !== notifiedStatus.current && ['Aceita', 'MotoristaChegando', 'Finalizada', 'Cancelada'].includes(status)) {
          notifiedStatus.current = status;
          if (canNotify.current) {
            await Notifications.scheduleNotificationAsync({
            content: { channelId: 'rides', title: 'Atualização da corrida', body: `Status: ${status}`, data: { rideId } },
              trigger: null,
            });
          }
        }
        if (data.corrida.status === 'Finalizada') go('Payment');
        if (data.corrida.status === 'Cancelada') setError('Esta corrida foi cancelada.');
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      }
    }

    async function requestNotificationPermission() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('rides', {
            name: 'Atualizações da corrida',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const current = await Notifications.getPermissionsAsync();
        canNotify.current = current.granted;
        if (!current.granted) {
          const permission = await Notifications.requestPermissionsAsync();
          canNotify.current = permission.granted;
          if (!permission.granted && mounted) {
            setError('Notificações desativadas. O status ainda será atualizado enquanto o app estiver aberto.');
          }
        }
      } catch (notificationError) {
        if (mounted) setError(`Não foi possível configurar notificações: ${notificationError.message}`);
      }
    }

    requestNotificationPermission();
    refreshRide();
    const timer = setInterval(refreshRide, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [go, rideId, setSession]);

  async function cancelRide() {
    setError('');
    try {
      const { data } = await api.post(`/corridas/${rideId}/cancelar`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
      go('Home');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const marker = session.activeRide?.localizacao
    ? { latitude: Number(session.activeRide.localizacao.latitude), longitude: Number(session.activeRide.localizacao.longitude) }
    : {
      latitude: Number(ride?.latitudeOrigem) || -23.5505,
      longitude: Number(ride?.longitudeOrigem) || -46.6333,
    };

  return (
    <Page title="Acompanhamento da corrida" go={go} back="Home">
      <MapPicker value={marker} interactive={false} />
      <Card>
        <Text style={s.h2}>
          {ride?.status === 'Solicitada' ? 'Buscando motorista…' : ride?.status}
        </Text>
        <Text>{ride?.origem} → {ride?.destino}</Text>
        <Text style={s.muted}>Distância estimada: {ride?.distanciaKm} km</Text>
        <Text style={s.muted}>Valor: R$ {Number(ride?.valorCorrida || 0).toFixed(2)}</Text>
      </Card>
      {driver ? (
        <Card>
          <Text style={{ fontWeight: '700' }}>Motorista: {driver.user?.nome}</Text>
          <Text style={s.muted}>{driver.veiculos?.[0]?.marca} {driver.veiculos?.[0]?.modelo}</Text>
        </Card>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {ride?.status === 'Finalizada' ? <Button onPress={() => go('Payment')}>Ir para pagamento</Button> : null}
      {['Solicitada', 'Aceita', 'MotoristaChegando'].includes(ride?.status) ? (
        <Button light onPress={cancelRide}>Cancelar corrida</Button>
      ) : null}
    </Page>
  );
}

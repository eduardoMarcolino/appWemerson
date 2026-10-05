import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import * as Location from 'expo-location';
import RideMap from '../components/RideMap';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function Trip({ go, session, setSession }) {
  const [error, setError] = useState('');
  const ride = session.activeRide?.corrida;
  const rideId = ride?.corridaId;

  useEffect(() => {
    if (!rideId || ride?.status !== 'EmAndamento') return undefined;
    let active = true;

    async function updateLocation() {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!permission.granted) {
          if (active) setError('Permita a localização para compartilhar a posição da corrida.');
          return;
        }

        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { data } = await api.post(`/corridas/${rideId}/localizacao`, {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        if (active) {
          setSession((sessionState) => ({
            ...sessionState,
            activeRide: { ...sessionState.activeRide, localizacao: data },
          }));
          setError('');
        }
      } catch (locationError) {
        if (active) setError(locationError.message);
      }
    }

    updateLocation();
    const timer = setInterval(updateLocation, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ride?.status, rideId, setSession]);

  return (
    <Page title="Em viagem" go={go} back="StartRide">
      {ride ? (
        <>
          <Card>
            <Text style={{ fontWeight: '800' }}>Rumo ao destino</Text>
            <Text style={s.muted}>{ride.destino}</Text>
          </Card>
          <RideMap ride={ride} location={session.activeRide?.localizacao} />
          <Card>
            <Text style={s.muted}>Distância estimada</Text>
            <Text style={{ fontWeight: '800' }}>{ride.distanciaKm} km</Text>
            <Text style={s.muted}>Passageiro: {ride.beneficiarioNome || 'titular da conta'}</Text>
          </Card>
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          <Button onPress={() => go('FinishRide')}>Cheguei ao destino</Button>
        </>
      ) : <Text style={s.muted}>Não há corrida em andamento.</Text>}
    </Page>
  );
}

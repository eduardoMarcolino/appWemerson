import React, { useState } from 'react';
import { Text } from 'react-native';
import RideMap from '../components/RideMap';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function StartRide({ go, session, setSession }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ride = session.activeRide?.corrida;
  const rideId = ride?.corridaId;
  const arrived = ride?.status === 'MotoristaChegando';

  async function markArrived() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/corridas/${rideId}/cheguei`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function startRide() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/corridas/${rideId}/iniciar`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
      go('Trip');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Iniciar corrida" go={go} back="RideAccepted">
      {ride ? (
        <>
          <Card>
            <Text style={{ fontWeight: '800' }}>{arrived ? 'Embarque confirmado' : 'Chegue ao local de embarque'}</Text>
            <Text style={s.muted}>{ride.origem}</Text>
          </Card>
          <RideMap ride={ride} />
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          {arrived ? (
            <Button onPress={startRide} disabled={loading}>
              {loading ? 'Iniciando…' : 'Iniciar corrida'}
            </Button>
          ) : (
            <Button onPress={markArrived} disabled={loading}>
              {loading ? 'Atualizando…' : 'Cheguei ao embarque'}
            </Button>
          )}
        </>
      ) : <Text style={s.muted}>Não há corrida ativa.</Text>}
    </Page>
  );
}

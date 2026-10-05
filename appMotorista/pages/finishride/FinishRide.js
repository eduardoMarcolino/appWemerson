import React, { useState } from 'react';
import { Text } from 'react-native';
import RideMap from '../components/RideMap';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function FinishRide({ go, session, setSession }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ride = session.activeRide?.corrida;

  async function finish() {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/corridas/${ride.corridaId}/finalizar`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
      go('RatePassenger');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Finalizar corrida" go={go} back="Trip">
      {ride ? (
        <>
          <RideMap ride={ride} location={session.activeRide?.localizacao} />
          <Text style={{ fontSize: 21, fontWeight: '900', textAlign: 'center' }}>Chegou ao destino?</Text>
          <Card>
            <Text style={s.muted}>{ride.destino}</Text>
            <Text style={{ fontSize: 24, fontWeight: '900' }}>
              R$ {Number(ride.valorCorrida).toFixed(2)}
            </Text>
            <Text style={s.muted}>O pagamento será confirmado pelo passageiro no app.</Text>
          </Card>
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          <Button onPress={finish} disabled={loading}>
            {loading ? 'Finalizando…' : 'Finalizar corrida'}
          </Button>
        </>
      ) : <Text style={s.muted}>Não há corrida para finalizar.</Text>}
    </Page>
  );
}

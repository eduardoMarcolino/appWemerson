import React, { useState } from 'react';
import { Text } from 'react-native';
import RideMap from '../components/RideMap';
import { api } from '../api';
import { Button, Card, Location, Page, s } from '../ui';

export default function RideDetails({ go, session, setSession }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ride = session.activeRide?.corrida;

  async function acceptRide() {
    if (!ride?.corridaId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/corridas/${ride.corridaId}/aceitar`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
      go('RideAccepted');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Detalhes da corrida" go={go} back="NewRequest">
      {ride ? (
        <>
          <RideMap ride={ride} />
          <Card>
            <Location title={ride.origem} detail="Local de embarque" />
            <Location title={ride.destino} detail="Destino" />
            <Text style={s.muted}>Distância estimada: {ride.distanciaKm} km</Text>
            <Text style={s.muted}>Categoria: {ride.categoria}</Text>
            <Text style={{ fontSize: 24, fontWeight: '900' }}>
              R$ {Number(ride.valorCorrida).toFixed(2)}
            </Text>
            {ride.beneficiarioNome ? <Text>Passageiro: {ride.beneficiarioNome}</Text> : null}
          </Card>
          {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
          <Button onPress={acceptRide} disabled={loading}>
            {loading ? 'Aceitando…' : 'Aceitar corrida'}
          </Button>
          <Button light onPress={() => go('NewRequest')}>Voltar às solicitações</Button>
        </>
      ) : (
        <Text style={s.muted}>Selecione uma solicitação disponível.</Text>
      )}
    </Page>
  );
}

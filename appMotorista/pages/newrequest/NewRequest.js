import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function NewRequest({ go, setSession }) {
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/motorista/corridas/ofertas');
      setOffers(data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 7000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <Page title="Solicitações disponíveis" go={go} back="Home">
      <Button light onPress={refresh} disabled={refreshing}>
        {refreshing ? 'Atualizando…' : 'Atualizar solicitações'}
      </Button>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {offers.length === 0 ? <Card><Text style={s.muted}>Nenhuma corrida disponível no momento.</Text></Card> : null}
      {offers.map((offer) => {
        const ride = offer.corrida;
        return (
          <Pressable
            key={ride.corridaId}
            onPress={() => {
              setSession((current) => ({ ...current, activeRide: offer }));
              go('RideDetails');
            }}
          >
            <Card>
              <Text style={{ fontWeight: '800' }}>{ride.origem} → {ride.destino}</Text>
              <Text style={s.muted}>{ride.distanciaKm} km · categoria {ride.categoria}</Text>
              <Text style={{ color: '#087a50', fontWeight: '800' }}>
                R$ {Number(ride.valorCorrida).toFixed(2)}
              </Text>
            </Card>
          </Pressable>
        );
      })}
    </Page>
  );
}

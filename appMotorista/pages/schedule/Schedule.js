import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';

export default function Schedule({ go, setSession }) {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/motorista/corridas/agendadas');
      setRides(data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function accept(id) {
    setBusyId(id);
    setError('');
    try {
      const { data } = await api.post(`/corridas/${id}/aceitar`, {});
      setSession((current) => ({ ...current, activeRide: data.corrida }));
      go('RideAccepted');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page title="Agenda" go={go} nav="Schedule">
      <Text style={s.h2}>Corridas agendadas disponíveis</Text>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {rides.length === 0 && !error ? <Text style={s.muted}>Nenhuma corrida agendada disponível.</Text> : null}
      {rides.map(({ corrida, agendamento }) => (
        <Card key={corrida.corridaId}>
          <Text style={{ fontWeight: '800' }}>{corrida.origem} → {corrida.destino}</Text>
          <Text style={s.muted}>
            {new Date(agendamento?.dataHora).toLocaleString('pt-BR')}
          </Text>
          <Text style={s.muted}>{corrida.categoria} · {corrida.distanciaKm} km</Text>
          <Text style={{ fontWeight: '800' }}>R$ {Number(corrida.valorCorrida).toFixed(2)}</Text>
          <Button onPress={() => accept(corrida.corridaId)} disabled={busyId !== null}>
            {busyId === corrida.corridaId ? 'Aceitando…' : 'Aceitar agendamento'}
          </Button>
        </Card>
      ))}
    </Page>
  );
}

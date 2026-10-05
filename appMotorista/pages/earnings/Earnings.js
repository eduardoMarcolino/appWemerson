import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Button, Card, Divider, Metric, Page, s } from '../ui';

export default function Earnings({ go }) {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/motorista/corridas')
      .then(({ data }) => setRides(data.filter((entry) => entry.corrida.status === 'Finalizada')))
      .catch((requestError) => setError(requestError.message));
  }, []);

  const total = rides.reduce((sum, entry) => sum + Number(entry.corrida.valorCorrida || 0), 0);
  const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Page title="Ganhos" go={go} nav="Earnings">
      <Text style={s.muted}>Total de corridas finalizadas</Text>
      <Text style={{ fontSize: 31, fontWeight: '900' }}>{formattedTotal}</Text>
      <Card>
        <Text style={{ fontWeight: '800' }}>Detalhamento</Text>
        <Metric label="Corridas concluídas" value={String(rides.length)} />
        <Metric label="Total bruto" value={formattedTotal} />
        <Divider />
        <Metric label="Saldo de teste" value={formattedTotal} strong />
      </Card>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {rides.map(({ corrida }) => (
        <Card key={corrida.corridaId}>
          <Text>{corrida.origem} → {corrida.destino}</Text>
          <Text style={s.muted}>{new Date(corrida.dataFim).toLocaleDateString('pt-BR')}</Text>
          <Text style={{ fontWeight: '800' }}>
            R$ {Number(corrida.valorCorrida).toFixed(2)}
          </Text>
        </Card>
      ))}
      <Button light onPress={() => go('Home')}>Voltar</Button>
    </Page>
  );
}

import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { Card, Page, s } from '../ui';

export default function History({ go }) {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/motorista/corridas')
      .then(({ data }) => setRides(data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <Page title="Histórico de corridas" go={go} nav="History">
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {rides.length === 0 && !error ? <Text style={s.muted}>Ainda não há corridas no histórico.</Text> : null}
      {rides.map((entry) => {
        const ride = entry.corrida;
        return (
          <Card key={ride.corridaId}>
            <Text style={{ color: '#087a50', fontWeight: '800' }}>
              {new Date(ride.dataSolicitacao).toLocaleString('pt-BR')}
            </Text>
            <Text>{ride.origem} → {ride.destino}</Text>
            <Text style={s.muted}>{ride.status} · {ride.distanciaKm} km</Text>
            <Text style={[s.muted, { textAlign: 'right' }]}>
              R$ {Number(ride.valorCorrida).toFixed(2)}
            </Text>
          </Card>
        );
      })}
    </Page>
  );
}

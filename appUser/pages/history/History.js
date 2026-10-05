import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { Card, Nav, Page, s } from '../ui';

export default function History({ go }) {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/passageiro/corridas')
      .then(({ data }) => setRides(data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Page title="Histórico" go={go}>
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        {rides.length === 0 && !error ? <Text style={s.muted}>Ainda não há corridas no histórico.</Text> : null}
        {rides.map((entry) => {
          const ride = entry.corrida;
          return (
            <Card key={ride.corridaId}>
              <Text style={{ color: '#087a50', fontWeight: '700' }}>
                {new Date(ride.dataSolicitacao).toLocaleString('pt-BR')}
              </Text>
              <Text>{ride.origem} → {ride.destino}</Text>
              <Text style={s.muted}>{ride.status}</Text>
              <Text style={[s.muted, { textAlign: 'right' }]}>
                R$ {Number(ride.valorCorrida).toFixed(2)}
              </Text>
            </Card>
          );
        })}
      </Page>
      <Nav go={go} active="History" />
    </View>
  );
}

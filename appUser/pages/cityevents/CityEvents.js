import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Nav, Page, s } from '../ui';

export default function CityEvents({ go }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setEvents(data.eventos))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Page title="Eventos da cidade" go={go} back="Home">
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        {events.length === 0 && !error ? <Text style={s.muted}>Não há eventos ativos cadastrados.</Text> : null}
        {events.map((event) => (
          <Card key={event.eventoId}>
            <View style={s.row}>
              <Text style={{ fontSize: 32 }}>📅</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700' }}>{event.nome}</Text>
                <Text style={s.muted}>{event.local} · {new Date(event.dataInicio).toLocaleString('pt-BR')}</Text>
                {event.descricao ? <Text style={s.muted}>{event.descricao}</Text> : null}
              </View>
            </View>
            <Button onPress={() => go('SearchDestination')} light>
              Ir de corrida
            </Button>
          </Card>
        ))}
      </Page>
      <Nav go={go} active="CityEvents" />
    </View>
  );
}

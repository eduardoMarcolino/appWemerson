import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Nav, s } from '../ui';

export default function Home({ go, session, updateDraft }) {
  const [data, setData] = useState({ pontosInteresse: [], eventos: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/app-data')
      .then(({ data: appData }) => setData(appData))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={x.header}>
        <Text numberOfLines={1} style={x.hello}>Olá, {session.user?.nome?.split(' ')[0] || 'passageiro'}! 👋</Text>
        <Text style={{ color: '#fff' }}>🔔</Text>
      </View>

      <ScrollView style={x.body} contentContainerStyle={x.bodyContent} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => go('SearchDestination')}>
          <Field placeholder="🔎  Para onde vamos?" />
        </Pressable>

        <Text style={s.muted}>Digite um destino ou escolha abaixo</Text>

        <View style={x.quick}>
          {data.pontosInteresse.slice(0, 4).map((point) => (
            <Pressable
              key={point.pontoInteresseId}
              onPress={() => {
                updateDraft({
                  destino: point.nome,
                  latitudeDestino: Number(point.latitude),
                  longitudeDestino: Number(point.longitude),
                  dataHora: null,
                });
                go('Schedule');
              }}
              style={x.quickItem}
            >
              <Text style={{ fontSize: 22, color: '#087a50' }}>📍</Text>
              <Text numberOfLines={1} style={s.muted}>{point.nome}</Text>
            </Pressable>
          ))}
        </View>

        {data.eventos.length > 0 ? <Card style={x.event}>
          <Text style={s.h2}>Eventos próximos</Text>
          <Text style={{ fontWeight: '700' }}>{data.eventos[0].nome}</Text>
          <Text style={s.muted}>{data.eventos[0].local} · {new Date(data.eventos[0].dataInicio).toLocaleString('pt-BR')}</Text>
          <Pressable onPress={() => go('CityEvents')}>
            <Text style={x.action}>Ver eventos</Text>
          </Pressable>
        </Card> : null}
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        {data.pontosInteresse.length === 0 && !error ? <Text style={s.muted}>Ainda não há locais sugeridos cadastrados.</Text> : null}

        <Button onPress={() => go('SearchDestination')}>Solicitar corrida</Button>
      </ScrollView>

      <Nav go={go} />
    </View>
  );
}

const x = StyleSheet.create({
  header: {
    backgroundColor: '#075c3e',
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    paddingTop: 28,
  },
  hello: {
    flex: 1,
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 16,
    gap: 12,
  },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickItem: {
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#edf7f1',
    padding: 9,
    borderRadius: 10,
    flex: 1,
    minWidth: 0,
  },
  event: {
    backgroundColor: '#fff0e8',
    gap: 6,
  },
  action: {
    color: '#087a50',
    fontWeight: '700',
    textAlign: 'right',
  },
});

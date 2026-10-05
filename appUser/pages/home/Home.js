import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Button, Card, Field, Nav, green, s } from '../ui';

const quick = [
  ['⌂', 'Casa', -23.551, -46.632],
  ['▣', 'Trabalho', -23.548, -46.637],
  ['✚', 'Hospital', -23.5488, -46.6388],
  ['▰', 'Escola', -23.553, -46.631],
];

export default function Home({ go, session, updateDraft }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={x.header}>
        <Text style={x.hello}>Olá, {session.user?.nome?.split(' ')[0] || 'passageiro'}! 👋</Text>
        <Text style={{ color: '#fff' }}>🔔</Text>
      </View>

      <View style={x.body}>
        <Pressable onPress={() => go('SearchDestination')}>
          <Field placeholder="🔎  Para onde vamos?" />
        </Pressable>

        <Text style={s.muted}>Digite um destino ou escolha abaixo</Text>

        <View style={x.quick}>
          {quick.map(([icon, title, latitude, longitude]) => (
            <Pressable
              key={title}
              onPress={() => {
                updateDraft({
                  destino: title,
                  latitudeDestino: latitude,
                  longitudeDestino: longitude,
                  dataHora: null,
                });
                go('Schedule');
              }}
              style={x.quickItem}
            >
              <Text style={{ fontSize: 22, color: green }}>{icon}</Text>
              <Text style={s.muted}>{title}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={x.event}>
          <Text style={s.h2}>Corridas para eventos</Text>
          <Text style={{ fontWeight: '700' }}>Festa da Cidade 🎉</Text>
          <Text style={s.muted}>Hoje na Praça Central</Text>
          <Pressable onPress={() => go('CityEvents')}>
            <Text style={x.action}>Ver eventos</Text>
          </Pressable>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700' }}>🎁 Mercado Central</Text>
          <Text style={s.muted}>10% OFF na sua corrida</Text>
        </Card>

        <Button onPress={() => go('SearchDestination')}>Solicitar corrida</Button>
      </View>

      <Nav go={go} />
    </View>
  );
}

const x = StyleSheet.create({
  header: {
    backgroundColor: '#075c3e',
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  hello: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  body: {
    flex: 1,
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
    width: '22%',
  },
  event: {
    backgroundColor: '#fff0e8',
    gap: 6,
  },
  action: {
    color: green,
    fontWeight: '700',
    textAlign: 'right',
  },
});

import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Nav, Page, s } from '../ui';

const data = [
  ['🎆', 'Festa da Cidade 🎉', 'Praça Central · Hoje às 20:00'],
  ['🎪', 'Shows na Praça', 'Praça da Matriz · Amanhã às 19:00'],
  ['🌾', 'Feira Municipal', 'Centro da Cidade · Domingo 07:00'],
];

export default function CityEvents({ go }) {
  return (
    <View style={{ flex: 1 }}>
      <Page title="Eventos da cidade" go={go} back="Home">
        {data.map(([icon, title, desc]) => (
          <Card key={title}>
            <View style={s.row}>
              <Text style={{ fontSize: 32 }}>{icon}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700' }}>{title}</Text>
                <Text style={s.muted}>{desc}</Text>
              </View>
            </View>
            <Button onPress={() => go('Category')} light>
              Ir de corrida
            </Button>
          </Card>
        ))}
      </Page>
      <Nav go={go} active="CityEvents" />
    </View>
  );
}

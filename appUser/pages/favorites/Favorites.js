import React from 'react';
import { Text, View } from 'react-native';
import { Card, Nav, Page, s } from '../ui';

const place = ['⌂  Casa', '▣  Trabalho', '✚  Hospital São Lucas', '▰  Rodoviária'];

export default function Favorites({ go }) {
  return (
    <View style={{ flex: 1 }}>
      <Page title="Favoritos" go={go}>
        {place.map((item) => (
          <Card key={item}>
            <Text style={{ fontWeight: '700' }}>{item}</Text>
            <Text style={s.muted}>Centro · endereço salvo</Text>
          </Card>
        ))}
        <Text style={s.h2}>Motoristas favoritos</Text>
        <Card>
          <Text style={{ fontWeight: '700' }}>👨🏽 Carlos Lima · ⭐ 4,8</Text>
          <Text style={s.muted}>Chevrolet Onix · Prata</Text>
        </Card>
      </Page>
      <Nav go={go} />
    </View>
  );
}

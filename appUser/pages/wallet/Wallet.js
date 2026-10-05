import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Nav, Page, s } from '../ui';

export default function Wallet({ go }) {
  return (
    <View style={{ flex: 1 }}>
      <Page title="Carteira" go={go}>
        <Card style={{ backgroundColor: '#e6f5ee' }}>
          <Text style={s.muted}>Saldo disponível</Text>
          <Text style={{ fontSize: 28, fontWeight: '800' }}>R$ 48,70</Text>
          <Button onPress={() => {}}>Adicionar saldo</Button>
        </Card>

        <Text style={s.h2}>Formas de pagamento</Text>
        {['•••• 1234 · Padrão 🟠', '•••• 5678 · VISA', '•••• 9101 · Mastercard'].map((item) => (
          <Card key={item}>
            <Text>{item}</Text>
          </Card>
        ))}

        <Text style={s.h2}>Extrato recente</Text>
        <Card>
          <Text>12/05 Corrida R$ 11,90</Text>
          <Text>10/05 Corrida R$ 9,50</Text>
        </Card>
      </Page>
      <Nav go={go} />
    </View>
  );
}

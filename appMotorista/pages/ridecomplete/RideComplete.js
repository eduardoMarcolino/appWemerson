import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Divider, Metric, Page, s } from '../ui';

export default function RideComplete({ go, session }) {
  const ride = session.activeRide?.corrida;
  const price = Number(ride?.valorCorrida || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <Page go={go} back="Home">
      <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#38c779', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 28 }}>
        <Text style={{ color: '#fff', fontSize: 52, fontWeight: '900' }}>✓</Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 10 }}>Corrida concluída!</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>Obrigado por dirigir com a gente.</Text>
      <Card>
        <Text style={{ fontWeight: '800' }}>Resumo da corrida</Text>
        <Metric label="Distância" value={`${ride?.distanciaKm || 0} km`} />
        <Metric label="Valor da corrida" value={price} />
        <Divider />
        <Metric label="Valor registrado" value={price} strong />
      </Card>
      <Button onPress={() => go('Earnings')}>Ver ganhos</Button>
      <Button light onPress={() => go('Home')}>Voltar ao início</Button>
    </Page>
  );
}

import React from 'react';
import { Text } from 'react-native';
import RideMap from '../components/RideMap';
import { Button, Card, Location, Page, s } from '../ui';

export default function RideAccepted({ go, session }) {
  const ride = session.activeRide?.corrida;
  return (
    <Page title="Corrida aceita" go={go} back="Home">
      <Text style={{ color: '#087a50', fontSize: 24, fontWeight: '900', textAlign: 'center' }}>✓ Corrida aceita</Text>
      {ride ? (
        <>
          <RideMap ride={ride} />
          <Card>
            <Location title={ride.origem} detail="Ponto de embarque" />
            <Text style={s.muted}>Passageiro: {ride.beneficiarioNome || 'Corrida para o titular da conta'}</Text>
            <Text style={{ fontWeight: '800' }}>R$ {Number(ride.valorCorrida).toFixed(2)}</Text>
          </Card>
          <Button onPress={() => go('StartRide')}>Ir para o embarque</Button>
        </>
      ) : <Text style={s.muted}>Não há corrida ativa.</Text>}
    </Page>
  );
}

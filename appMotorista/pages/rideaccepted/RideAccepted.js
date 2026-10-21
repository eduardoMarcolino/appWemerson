import { ThemedText as Text } from '../ui';
import React from 'react';

import RideMap from '../components/RideMap';
import { Button, Card, Location, Page, s } from '../ui';
import RideCancellation from '../components/RideCancellation';

export default function RideAccepted({ go, session, setSession }) {
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
          <RideCancellation rideId={ride.corridaId} onCancelled={(cancelledRide) => { setSession((current) => ({ ...current, activeRide: cancelledRide })); go('Home'); }} />
        </>
      ) : <Text style={s.muted}>Não há corrida ativa.</Text>}
    </Page>
  );
}

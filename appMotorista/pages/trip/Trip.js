import { ThemedText as Text } from '../ui';
import React from 'react';
import RideMap from '../components/RideMap';
import { Button, Card, Page, s } from '../ui';
import RideCancellation from '../components/RideCancellation';
import RideIncidentPanel from '../components/RideIncidentPanel';

export default function Trip({ go, session, setSession, locationShareMessage }) {
  const ride = session.activeRide?.corrida;
  const driverLocation = session.activeRide?.localizacaoMotorista || session.activeRide?.localizacao;
  const passengerLocation = session.activeRide?.localizacaoPassageiro;
  const passengerLocationAge = passengerLocation?.dataHora
    ? Date.now() - new Date(passengerLocation.dataHora).getTime()
    : null;

  return (
    <Page title="Em viagem" go={go} back="StartRide">
      {ride ? (
        <>
          <Card>
            <Text style={{ fontWeight: '800' }}>Rumo ao destino</Text>
            <Text style={s.muted}>{ride.destino}</Text>
          </Card>
          <RideMap ride={ride} location={driverLocation} participantLocation={passengerLocation} />
          <Card>
            <Text style={s.muted}>Distância estimada</Text>
            <Text style={{ fontWeight: '800' }}>{ride.distanciaKm} km</Text>
            <Text style={s.muted}>Passageiro: {ride.beneficiarioNome || 'titular da conta'}</Text>
            <Text style={s.muted}>
              {!passengerLocation ? 'Aguardando a localização do passageiro…' : passengerLocationAge > 30000 ? 'Sinal do passageiro desatualizado; mostrando a última posição recebida.' : 'Posição do passageiro atualizada.'}
            </Text>
          </Card>
          {locationShareMessage ? <Text style={s.muted}>{locationShareMessage}</Text> : null}
          <RideIncidentPanel rideId={ride.corridaId} enabled={ride.status === 'EmAndamento'} />
          <RideCancellation rideId={ride.corridaId} onCancelled={(cancelledRide) => { setSession((current) => ({ ...current, activeRide: cancelledRide })); go('Home'); }} />
          <Button onPress={() => go('FinishRide')}>Cheguei ao destino</Button>
        </>
      ) : <Text style={s.muted}>Não há corrida em andamento.</Text>}
    </Page>
  );
}

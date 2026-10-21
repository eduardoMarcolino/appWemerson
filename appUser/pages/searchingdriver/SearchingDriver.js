import { ThemedText as Text } from '../ui';
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Card, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';
import RideCancellation from '../components/RideCancellation';
import RideIncidentPanel from '../components/RideIncidentPanel';

function hasRideViewChanged(previous, next) {
  if (!previous || !next) return previous !== next;

  return previous.corrida?.corridaId !== next.corrida?.corridaId
    || previous.corrida?.status !== next.corrida?.status
    || previous.corrida?.origem !== next.corrida?.origem
    || previous.corrida?.destino !== next.corrida?.destino
    || previous.localizacao?.latitude !== next.localizacao?.latitude
    || previous.localizacao?.longitude !== next.localizacao?.longitude
    || previous.localizacao?.dataHora !== next.localizacao?.dataHora
    || previous.localizacaoMotorista?.latitude !== next.localizacaoMotorista?.latitude
    || previous.localizacaoMotorista?.longitude !== next.localizacaoMotorista?.longitude
    || previous.localizacaoMotorista?.dataHora !== next.localizacaoMotorista?.dataHora
    || previous.localizacaoPassageiro?.latitude !== next.localizacaoPassageiro?.latitude
    || previous.localizacaoPassageiro?.longitude !== next.localizacaoPassageiro?.longitude
    || previous.localizacaoPassageiro?.dataHora !== next.localizacaoPassageiro?.dataHora
    || previous.motorista?.user?.nome !== next.motorista?.user?.nome
    || previous.motorista?.veiculos?.[0]?.marca !== next.motorista?.veiculos?.[0]?.marca
    || previous.motorista?.veiculos?.[0]?.modelo !== next.motorista?.veiculos?.[0]?.modelo
    || previous.motorista?.veiculos?.[0]?.placa !== next.motorista?.veiculos?.[0]?.placa
    || previous.agendamento?.dataHora !== next.agendamento?.dataHora;
}
export default function SearchingDriver({ go, session, setSession, locationShareMessage }) {
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const rideId = session.activeRide?.corrida?.corridaId;
  const ride = session.activeRide?.corrida;
  const driver = session.activeRide?.motorista;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!rideId) {
      setError('Não foi possível identificar a corrida.');
      return undefined;
    }

    let mounted = true;
    let refreshPending = false;
    async function refreshRide() {
      if (refreshPending) return;
      refreshPending = true;
      try {
        const { data } = await api.get(`/corridas/${rideId}`);
        if (!mounted) return;
        setSession((current) => {
          if (!hasRideViewChanged(current.activeRide, data)) return current;
          return { ...current, activeRide: data };
        });
        if (data.corrida.status === 'Finalizada') go('RateDriver');
        if (data.corrida.status === 'Cancelada') setError(`Esta corrida foi cancelada. Motivo: ${data.corrida.motivoCancelamento || 'não informado'}`);
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      } finally {
        refreshPending = false;
      }
    }

    refreshRide();
    const timer = setInterval(refreshRide, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [go, rideId, setSession]);

  const driverLocation = session.activeRide?.localizacaoMotorista || session.activeRide?.localizacao;
  const locationAge = driverLocation?.dataHora
    ? currentTime - new Date(driverLocation.dataHora).getTime()
    : null;
  const marker = driverLocation
    ? { latitude: Number(driverLocation.latitude), longitude: Number(driverLocation.longitude) }
    : {
      latitude: Number(ride?.latitudeOrigem) || -23.5505,
      longitude: Number(ride?.longitudeOrigem) || -46.6333,
    };

  return (
    <Page title="Acompanhamento da corrida" go={go} back="Home">
      <MapPicker value={marker} interactive={false} />
      <Text style={s.muted}>
        {!driverLocation ? 'Aguardando a localização do motorista…' : locationAge > 30000 ? 'Sinal do motorista desatualizado; mostrando a última posição recebida.' : 'Posição do motorista atualizada.'}
      </Text>
      {locationShareMessage ? <Text style={s.muted}>{locationShareMessage}</Text> : null}
      <Card>
        <Text style={s.h2}>
          {ride?.status === 'Solicitada' ? 'Buscando motorista…' : ride?.status}
        </Text>
        <Text>{ride?.origem} → {ride?.destino}</Text>
        <Text style={s.muted}>Distância estimada: {ride?.distanciaKm} km</Text>
        <Text style={s.muted}>Valor: R$ {Number(ride?.valorCorrida || 0).toFixed(2)}</Text>
      </Card>
      {driver ? (
        <Card>
          <Text style={{ fontWeight: '700' }}>Motorista: {driver.user?.nome}</Text>
          <Text style={s.muted}>{driver.veiculos?.[0]?.marca} {driver.veiculos?.[0]?.modelo}</Text>
        </Card>
      ) : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {ride?.status === 'Finalizada' ? <Button onPress={() => go('RateDriver')}>Avaliar motorista</Button> : null}
      {['Solicitada', 'Aceita', 'MotoristaChegando', 'EmAndamento'].includes(ride?.status) ? (
        <RideCancellation rideId={rideId} onCancelled={(cancelledRide) => { setSession((current) => ({ ...current, activeRide: cancelledRide })); go('Home'); }} />
      ) : null}
      <RideIncidentPanel rideId={rideId} enabled={ride?.status === 'EmAndamento'} />
    </Page>
  );
}

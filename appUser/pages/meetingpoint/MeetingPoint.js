import React from 'react';
import { Pressable, Text } from 'react-native';
import { Button, Card, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';

const meetingPoints = [
  { name: 'Praça da Matriz', latitude: -23.5505, longitude: -46.6333 },
  { name: 'Rodoviária', latitude: -23.535, longitude: -46.6312 },
  { name: 'Igreja Matriz', latitude: -23.5518, longitude: -46.632 },
];

export default function MeetingPoint({ go, session, updateDraft }) {
  return (
    <Page title="Ponto de embarque" go={go} back="Schedule">
      <Text style={s.muted}>Selecione o local no mapa ou escolha uma sugestão.</Text>
      <MapPicker
        value={{ latitude: session.tripDraft.latitudeOrigem, longitude: session.tripDraft.longitudeOrigem }}
        onChange={(coordinate) => updateDraft({
          origem: 'Ponto selecionado no mapa',
          latitudeOrigem: coordinate.latitude,
          longitudeOrigem: coordinate.longitude,
        })}
      />
      {meetingPoints.map((point) => (
        <Pressable key={point.name} onPress={() => updateDraft({
          origem: point.name,
          latitudeOrigem: point.latitude,
          longitudeOrigem: point.longitude,
        })}>
          <Card style={session.tripDraft.origem === point.name ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text style={{ fontWeight: '700' }}>📍 {point.name}</Text>
          </Card>
        </Pressable>
      ))}
      <Button onPress={() => go('Beneficiary')}>Confirmar ponto de embarque</Button>
    </Page>
  );
}

import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Button, Card, Field, Page, s } from '../ui';
import MapPicker from '../components/MapPicker';

const places = [
  { name: 'Hospital São Lucas', latitude: -23.5488, longitude: -46.6388 },
  { name: 'Shopping Jardins', latitude: -23.5614, longitude: -46.6559 },
  { name: 'Mercado Central', latitude: -23.5443, longitude: -46.6358 },
  { name: 'Rodoviária', latitude: -23.535, longitude: -46.6312 },
];

export default function SearchDestination({ go, session, updateDraft }) {
  const [query, setQuery] = useState('');
  const suggestions = places.filter((place) => place.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Page title="Para onde vamos?" go={go}>
      <Field placeholder="Pesquisar destino" value={query} onChangeText={setQuery} />
      <Text style={s.h2}>Sugestões</Text>
      {suggestions.map((place) => (
        <Pressable key={place.name} onPress={() => updateDraft({
          destino: place.name,
          latitudeDestino: place.latitude,
          longitudeDestino: place.longitude,
        })}>
          <Card style={session.tripDraft.destino === place.name ? { borderColor: '#087a50', borderWidth: 2 } : null}>
            <Text style={{ fontWeight: '700' }}>📍 {place.name}</Text>
            <Text style={s.muted}>Toque para selecionar como destino</Text>
          </Card>
        </Pressable>
      ))}
      <MapPicker
        value={{ latitude: session.tripDraft.latitudeDestino, longitude: session.tripDraft.longitudeDestino }}
        onChange={(coordinate) => updateDraft({
          destino: 'Ponto selecionado no mapa',
          latitudeDestino: coordinate.latitude,
          longitudeDestino: coordinate.longitude,
        })}
      />
      <Button onPress={() => go('Schedule')} disabled={!session.tripDraft.destino}>
        Continuar
      </Button>
    </Page>
  );
}

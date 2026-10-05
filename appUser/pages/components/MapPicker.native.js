import React, { useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, s } from '../ui';

const fallback = { latitude: -23.5505, longitude: -46.6333 };

export default function MapPicker({ value, onChange = () => {}, interactive = true }) {
  const [error, setError] = useState('');
  const coordinate = value || fallback;

  async function useCurrentLocation() {
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Permita o acesso à localização ou escolha um ponto no mapa.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (locationError) {
      setError(`Não foi possível obter sua localização: ${locationError.message}`);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <MapView
        style={{ height: 220, borderRadius: 14 }}
        region={{
          ...coordinate,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        onPress={interactive ? (event) => onChange(event.nativeEvent.coordinate) : undefined}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
      >
        <Marker coordinate={coordinate} title="Ponto selecionado" />
      </MapView>
      {interactive ? <Text style={s.muted}>Toque no mapa para selecionar o ponto.</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {interactive ? <Button light onPress={useCurrentLocation}>Usar minha localização</Button> : null}
    </View>
  );
}

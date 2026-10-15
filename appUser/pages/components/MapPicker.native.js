import React, { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, s } from '../ui';

export default function MapPicker({ value, onChange = () => {}, interactive = true }) {
  const { width } = useWindowDimensions();
  const [error, setError] = useState('');
  const coordinate = value;
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);

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
        style={{ height: mapHeight, borderRadius: 14 }}
        region={coordinate ? { ...coordinate, latitudeDelta: 0.025, longitudeDelta: 0.025 } : undefined}
        onPress={interactive ? (event) => onChange(event.nativeEvent.coordinate) : undefined}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
      >
        {coordinate ? <Marker coordinate={coordinate} title="Ponto selecionado" /> : null}
      </MapView>
      {interactive ? <Text style={s.muted}>Toque no mapa para selecionar o ponto.</Text> : null}
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      {interactive ? <Button light onPress={useCurrentLocation}>Usar minha localização</Button> : null}
    </View>
  );
}

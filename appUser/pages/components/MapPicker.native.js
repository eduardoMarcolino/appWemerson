import { ThemedText as Text } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, s } from '../ui';

export default function MapPicker({ value, onChange = () => {}, interactive = true }) {
  const { width } = useWindowDimensions();
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const coordinate = value
    && value.latitude !== null && value.latitude !== undefined && value.latitude !== ''
    && value.longitude !== null && value.longitude !== undefined && value.longitude !== ''
    && Number.isFinite(Number(value.latitude))
    && Number.isFinite(Number(value.longitude))
    && Math.abs(Number(value.latitude)) <= 90
    && Math.abs(Number(value.longitude)) <= 180
    ? { latitude: Number(value.latitude), longitude: Number(value.longitude) }
    : null;
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);
  const latitude = coordinate?.latitude;
  const longitude = coordinate?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    }, 350);
  }, [latitude, longitude]);

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
    } catch {
      setError('Não foi possível obter sua localização. Tente novamente ou escolha um ponto no mapa.');
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ width: '100%', height: mapHeight, borderRadius: 14 }}
        initialRegion={coordinate
          ? { ...coordinate, latitudeDelta: 0.025, longitudeDelta: 0.025 }
          : { latitude: -15.78, longitude: -47.93, latitudeDelta: 20, longitudeDelta: 20 }}
        loadingEnabled
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

import { ThemedText as Text } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, s } from '../ui';

const LOCATION_TIMEOUT_MS = 12000;
const TRACKING_ANIMATION_MS = 4500;
const TRACKING_FRAME_MS = 50;
const DEFAULT_MAP_REGION = {
  latitude: -15.78,
  longitude: -47.93,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

function getCurrentPositionWithTimeout() {
  let timeoutId;
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error('O GPS demorou para responder.')), LOCATION_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timeoutId));
}

function makeRegion(coordinate) {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
}

function TrackingMarker({ coordinate }) {
  const [displayedCoordinate, setDisplayedCoordinate] = useState(coordinate);
  const displayedCoordinateRef = useRef(coordinate);

  useEffect(() => {
    const start = displayedCoordinateRef.current;
    const startedAt = Date.now();
    let timerId;

    function animate() {
      const progress = Math.min((Date.now() - startedAt) / TRACKING_ANIMATION_MS, 1);
      const nextCoordinate = {
        latitude: start.latitude + ((coordinate.latitude - start.latitude) * progress),
        longitude: start.longitude + ((coordinate.longitude - start.longitude) * progress),
      };
      displayedCoordinateRef.current = nextCoordinate;
      setDisplayedCoordinate(nextCoordinate);

      if (progress < 1) {
        timerId = setTimeout(animate, TRACKING_FRAME_MS);
      }
    }

    animate();
    return () => clearTimeout(timerId);
  }, [coordinate.latitude, coordinate.longitude]);

  return <Marker coordinate={displayedCoordinate} title="Motorista" />;
}

export default function MapPicker({ value, onChange = () => {}, interactive = true }) {
  const { width } = useWindowDimensions();
  const [error, setError] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
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
  const mapTarget = coordinate || (interactive ? deviceLocation : null);

  useEffect(() => {
    if (!interactive || coordinate) return undefined;
    let active = true;

    async function focusOnPassengerLocation() {
      let hasLastKnownLocation = false;
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!permission.granted) {
          if (active) setError('Permita o acesso à localização para centralizar o mapa. Você ainda pode escolher um ponto manualmente.');
          return;
        }
        if (active) setLocationPermissionGranted(true);

        const lastKnownPosition = await Location.getLastKnownPositionAsync({ maxAge: 30000, requiredAccuracy: 1000 });
        if (active && lastKnownPosition) {
          hasLastKnownLocation = true;
          setDeviceLocation({
            latitude: lastKnownPosition.coords.latitude,
            longitude: lastKnownPosition.coords.longitude,
          });
          setError('Atualizando a posição atual do GPS…');
        }

        const currentPosition = await getCurrentPositionWithTimeout();
        if (active) {
          setDeviceLocation({
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          });
          setError('');
        }
      } catch (_locationError) {
        if (active) {
          setError(hasLastKnownLocation
            ? 'O GPS demorou para responder. O mapa está usando a última localização conhecida.'
            : 'Não foi possível obter o GPS. Você ainda pode escolher um ponto manualmente.');
        }
      }
    }

    focusOnPassengerLocation();
    return () => {
      active = false;
    };
  }, [interactive, latitude, longitude]);

  useEffect(() => {
    if (!mapReady || !mapTarget) return;
    const duration = interactive ? 350 : TRACKING_ANIMATION_MS;
    mapRef.current?.animateToRegion(makeRegion(mapTarget), duration);
  }, [interactive, latitude, longitude, mapReady, deviceLocation?.latitude, deviceLocation?.longitude]);

  async function useCurrentLocation() {
    setError('');
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setError('Permita o acesso à localização ou escolha um ponto no mapa.');
        return;
      }
      setLocationPermissionGranted(true);

      const position = await getCurrentPositionWithTimeout();
      const currentCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setDeviceLocation(currentCoordinate);
      onChange(currentCoordinate);
    } catch (_locationError) {
      setError(deviceLocation
        ? 'O GPS demorou para responder. Tente novamente ou escolha o ponto no mapa.'
        : 'Não foi possível obter sua localização. Tente novamente ou escolha um ponto no mapa.');
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ width: '100%', height: mapHeight, borderRadius: 14 }}
        initialRegion={coordinate ? makeRegion(coordinate) : DEFAULT_MAP_REGION}
        loadingEnabled
        onMapReady={() => setMapReady(true)}
        showsUserLocation={interactive && locationPermissionGranted}
        onPress={interactive ? (event) => onChange(event.nativeEvent.coordinate) : undefined}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
      >
        {coordinate ? (
          interactive
            ? <Marker coordinate={coordinate} title="Ponto selecionado" />
            : <TrackingMarker coordinate={coordinate} />
        ) : null}
      </MapView>
      {interactive ? <Text style={s.muted}>Toque no mapa para selecionar o ponto.</Text> : null}
      {error ? <Text style={s.muted}>{error}</Text> : null}
      {interactive ? <Button light onPress={useCurrentLocation}>Usar minha localização</Button> : null}
    </View>
  );
}

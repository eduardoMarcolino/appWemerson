import { ThemedText as Text } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { s } from '../ui';

const LOCATION_TIMEOUT_MS = 12000;
const DRIVER_ZOOM_DELTA = 0.012;

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(latitude)
    && Math.abs(latitude) <= 90
    && Number.isFinite(longitude)
    && Math.abs(longitude) <= 180;
}

function getPositionWithTimeout() {
  let timeoutId;
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error('O GPS demorou para responder.')), LOCATION_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timeoutId));
}

export default function RideMap({ ride, location }) {
  const { width } = useWindowDimensions();
  const mapRef = useRef(null);
  const focusedRideRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [deviceLocationSource, setDeviceLocationSource] = useState(null);
  const [locationMessage, setLocationMessage] = useState('Obtendo localização atual…');
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);
  const origin = {
    latitude: Number(ride?.latitudeOrigem),
    longitude: Number(ride?.longitudeOrigem),
  };
  const destination = {
    latitude: Number(ride?.latitudeDestino),
    longitude: Number(ride?.longitudeDestino),
  };
  const coordinatesValid = !(ride?.latitudeOrigem === null || ride?.latitudeOrigem === undefined || ride.latitudeOrigem === ''
    || ride?.longitudeOrigem === null || ride?.longitudeOrigem === undefined || ride.longitudeOrigem === ''
    || ride?.latitudeDestino === null || ride?.latitudeDestino === undefined || ride.latitudeDestino === ''
    || ride?.longitudeDestino === null || ride?.longitudeDestino === ''
    || !isValidCoordinate(origin.latitude, origin.longitude)
    || !isValidCoordinate(destination.latitude, destination.longitude));
  const driverLatitude = Number(location?.latitude);
  const driverLongitude = Number(location?.longitude);
  const hasDriverLocation = Boolean(location)
    && isValidCoordinate(driverLatitude, driverLongitude);
  const serverLocation = hasDriverLocation
    ? { latitude: driverLatitude, longitude: driverLongitude }
    : null;
  const currentLocation = deviceLocation || serverLocation;
  const locationSource = deviceLocationSource || (serverLocation ? 'server' : null);
  const rideKey = String(ride?.corridaId ?? ride?.id ?? 'ride');

  useEffect(() => {
    let active = true;

    async function loadDeviceLocation() {
      let hasLastKnownPosition = false;
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }

        if (!permission.granted) {
          if (active) {
            setLocationMessage(hasDriverLocation
              ? 'Localização negada. Exibindo a última posição recebida.'
              : 'Localização negada. O mapa mostra os pontos da corrida.');
          }
          return;
        }

        const lastKnownPosition = await Location.getLastKnownPositionAsync({
          maxAge: 30000,
          requiredAccuracy: 1000,
        });
        if (active && lastKnownPosition) {
          hasLastKnownPosition = true;
          setDeviceLocation({
            latitude: lastKnownPosition.coords.latitude,
            longitude: lastKnownPosition.coords.longitude,
          });
          setDeviceLocationSource('last-known');
          setLocationMessage('Atualizando localização pelo GPS…');
        }

        const currentPosition = await getPositionWithTimeout();
        if (active) {
          setDeviceLocation({
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          });
          setDeviceLocationSource('current');
          setLocationMessage('');
        }
      } catch (_error) {
        if (active) {
          setLocationMessage(hasDriverLocation || hasLastKnownPosition
            ? 'O GPS demorou para responder. Exibindo a última posição conhecida.'
            : 'O GPS demorou para responder. O mapa mostra os pontos da corrida.');
        }
      }
    }

    if (hasDriverLocation) {
      setLocationMessage('Atualizando localização pelo GPS…');
    }
    loadDeviceLocation();

    return () => {
      active = false;
    };
  }, [hasDriverLocation, rideKey]);

  useEffect(() => {
    if (!coordinatesValid || !mapReady) return;

    if (currentLocation) {
      const focusKey = `${rideKey}:${locationSource}`;
      if (focusedRideRef.current !== focusKey) {
        mapRef.current?.animateToRegion({
          ...currentLocation,
          latitudeDelta: DRIVER_ZOOM_DELTA,
          longitudeDelta: DRIVER_ZOOM_DELTA,
        }, 500);
        focusedRideRef.current = focusKey;
      }
      return;
    }

    mapRef.current?.fitToCoordinates([origin, destination], {
      edgePadding: { top: 36, right: 36, bottom: 36, left: 36 },
      animated: true,
    });
  }, [
    mapReady,
    coordinatesValid,
    rideKey,
    currentLocation?.latitude,
    currentLocation?.longitude,
    locationSource,
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  ]);

  if (!coordinatesValid) {
    return (
      <View style={{ height: mapHeight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={s.muted}>O mapa não está disponível para esta corrida.</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative', height: mapHeight }}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ width: '100%', height: mapHeight, borderRadius: 14 }}
        mapType="standard"
        loadingEnabled
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: Math.max(Math.abs(origin.latitude - destination.latitude) * 1.5, 0.025),
          longitudeDelta: Math.max(Math.abs(origin.longitude - destination.longitude) * 1.5, 0.025),
        }}
      >
        <Marker coordinate={origin} title={ride?.origem || 'Embarque'} pinColor="green" />
        <Marker coordinate={destination} title={ride?.destino || 'Destino'} pinColor="red" />
        {currentLocation ? <Marker coordinate={currentLocation} title="Sua localização" /> : null}
        <Polyline coordinates={[origin, destination]} strokeColor="#087a50" strokeWidth={4} />
      </MapView>
      {locationMessage ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: 8, borderRadius: 8, backgroundColor: '#ffffffdd' }}>
          <Text style={{ color: '#26352e', fontSize: 12 }}>{locationMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

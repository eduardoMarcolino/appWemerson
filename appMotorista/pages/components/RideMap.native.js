import { ThemedText as Text } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { s } from '../ui';

export default function RideMap({ ride, location }) {
  const { width } = useWindowDimensions();
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
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
    || ride?.longitudeDestino === null || ride?.longitudeDestino === undefined || ride.longitudeDestino === ''
    || !Number.isFinite(origin.latitude) || Math.abs(origin.latitude) > 90
    || !Number.isFinite(origin.longitude) || Math.abs(origin.longitude) > 180
    || !Number.isFinite(destination.latitude) || Math.abs(destination.latitude) > 90
    || !Number.isFinite(destination.longitude) || Math.abs(destination.longitude) > 180);
  const driverLatitude = Number(location?.latitude);
  const driverLongitude = Number(location?.longitude);
  const hasDriverLocation = location
    && Number.isFinite(driverLatitude)
    && Math.abs(driverLatitude) <= 90
    && Number.isFinite(driverLongitude)
    && Math.abs(driverLongitude) <= 180;
  const driver = hasDriverLocation
    ? { latitude: driverLatitude, longitude: driverLongitude }
    : null;

  useEffect(() => {
    if (!coordinatesValid || !mapReady) return;
    mapRef.current?.fitToCoordinates([origin, destination], {
      edgePadding: { top: 36, right: 36, bottom: 36, left: 36 },
      animated: true,
    });
  }, [
    mapReady,
    coordinatesValid,
    ride?.corridaId,
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
      {driver ? <Marker coordinate={driver} title="Motorista" /> : null}
      <Polyline coordinates={[origin, destination]} strokeColor="#087a50" strokeWidth={4} />
    </MapView>
  );
}

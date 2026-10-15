import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { s } from '../ui';

export default function RideMap({ ride, location }) {
  const { width } = useWindowDimensions();
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);
  const origin = {
    latitude: Number(ride?.latitudeOrigem),
    longitude: Number(ride?.longitudeOrigem),
  };
  const destination = {
    latitude: Number(ride?.latitudeDestino),
    longitude: Number(ride?.longitudeDestino),
  };
  if (!Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude)
    || !Number.isFinite(destination.latitude) || !Number.isFinite(destination.longitude)) {
    return (
      <View style={{ height: mapHeight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={s.muted}>O mapa não está disponível para esta corrida.</Text>
      </View>
    );
  }
  const driver = location
    ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
    : origin;

  return (
    <MapView
      style={{ height: mapHeight, borderRadius: 14 }}
      initialRegion={{ ...origin, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
    >
      <Marker coordinate={origin} title={ride?.origem || 'Embarque'} pinColor="green" />
      <Marker coordinate={destination} title={ride?.destino || 'Destino'} pinColor="red" />
      <Marker coordinate={driver} title="Motorista" />
      <Polyline coordinates={[origin, destination]} strokeColor="#087a50" strokeWidth={4} />
    </MapView>
  );
}

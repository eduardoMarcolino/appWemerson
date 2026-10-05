import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

const fallback = { latitude: -23.5505, longitude: -46.6333 };

export default function RideMap({ ride, location }) {
  const origin = {
    latitude: Number(ride?.latitudeOrigem) || fallback.latitude,
    longitude: Number(ride?.longitudeOrigem) || fallback.longitude,
  };
  const destination = {
    latitude: Number(ride?.latitudeDestino) || fallback.latitude - 0.01,
    longitude: Number(ride?.longitudeDestino) || fallback.longitude + 0.01,
  };
  const driver = location
    ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
    : origin;

  return (
    <MapView
      style={{ height: 230, borderRadius: 14 }}
      initialRegion={{ ...origin, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
    >
      <Marker coordinate={origin} title={ride?.origem || 'Embarque'} pinColor="green" />
      <Marker coordinate={destination} title={ride?.destino || 'Destino'} pinColor="red" />
      <Marker coordinate={driver} title="Motorista" />
      <Polyline coordinates={[origin, destination]} strokeColor="#087a50" strokeWidth={4} />
    </MapView>
  );
}

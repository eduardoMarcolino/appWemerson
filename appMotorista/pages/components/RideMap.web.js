import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Text, View } from 'react-native';
import { s } from '../ui';

export default function RideMap() {
  const { width } = useWindowDimensions();
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);

  return (
    <View style={{ height: mapHeight, borderRadius: 14, backgroundColor: '#dcebe5', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
      <Text style={{ fontSize: 36 }}>📍</Text>
      <Text style={s.muted}>Abra este app no Expo Go para usar o mapa.</Text>
    </View>
  );
}

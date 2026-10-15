import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { s } from '../ui';

export default function MapPicker() {
  const { width } = useWindowDimensions();
  const mapHeight = Math.min(Math.max((Math.min(width, 760) - 32) * 0.55, 180), 320);

  return (
    <View style={{ height: mapHeight, borderRadius: 14, backgroundColor: '#dcebe5', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
      <Text style={{ fontSize: 36 }}>📍</Text>
      <Text style={s.muted}>Abra este app no Expo Go para usar o mapa e a localização.</Text>
    </View>
  );
}

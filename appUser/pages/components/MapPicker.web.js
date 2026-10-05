import React from 'react';
import { Text, View } from 'react-native';
import { s } from '../ui';

export default function MapPicker() {
  return (
    <View style={{ height: 220, borderRadius: 14, backgroundColor: '#dcebe5', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
      <Text style={{ fontSize: 36 }}>📍</Text>
      <Text style={s.muted}>Abra este app no Expo Go para usar o mapa e a localização.</Text>
    </View>
  );
}

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { green, s } from '../ui';

const items = [
  ['Home', 'Home'],
  ['Corridas', 'History'],
  ['Agenda', 'Schedule'],
  ['Ganhos', 'Earnings'],
  ['Desempenho', 'Performance'],
];

export default function SideMenu({ go, onLogout }) {
  return (
    <View style={x.page}>
      <Pressable onPress={() => go('Home')}><Text style={x.close}>×</Text></Pressable>
      <View style={x.brand}>
        <Text style={x.logo}>InteriorGo</Text>
        <Text style={s.muted}>Menu do motorista</Text>
      </View>
      {items.map(([label, target]) => (
        <Pressable key={label} onPress={() => go(target)} style={x.item}>
          <Text style={x.icon}>•</Text>
          <Text style={x.label}>{label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={onLogout} style={x.item}>
        <Text style={x.icon}>•</Text>
        <Text style={[x.label, { color: '#d94b45' }]}>Sair da conta</Text>
      </Pressable>
      <Text style={x.version}>Versão de testes</Text>
    </View>
  );
}

const x = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff', padding: 22 },
  close: { fontSize: 30, color: '#14231d' },
  brand: { paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: '#e5ebe8', marginBottom: 12 },
  logo: { color: green, fontWeight: '900', fontSize: 25 },
  item: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { color: green, fontSize: 25 },
  label: { fontWeight: '700', color: '#14231d' },
  version: { textAlign: 'center', color: '#6f7c76', fontSize: 12, marginTop: 50 },
});

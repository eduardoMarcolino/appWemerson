import { ThemedText as Text } from '../ui';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { getThemeColors, green, s } from '../ui';

const items = [
  ['Home', 'Home'],
  ['Corridas', 'History'],
  ['Agenda', 'Schedule'],
  ['Ganhos', 'Earnings'],
  ['Desempenho', 'Performance'],
];

export default function SideMenu({ go, onLogout }) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const theme = getThemeColors(colorScheme);

  return (
    <ScrollView
      style={[x.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        x.page,
        { paddingHorizontal: width < 360 ? 16 : 22, backgroundColor: theme.background },
      ]}
    >
      <View style={x.content}>
        <Pressable onPress={() => go('Home')}><Text style={[x.close, { color: theme.text }]}>×</Text></Pressable>
        <View style={[x.brand, { borderBottomColor: theme.border }]}>
          <Text style={[x.logo, { color: colorScheme === 'dark' ? '#92d3b3' : green }]}>InteriorGo</Text>
          <Text style={s.muted}>Menu do motorista</Text>
        </View>
        {items.map(([label, target]) => (
          <Pressable key={label} onPress={() => go(target)} style={x.item}>
            <Text style={x.icon}>•</Text>
            <Text style={[x.label, { color: theme.text }]}>{label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onLogout} style={x.item}>
          <Text style={x.icon}>•</Text>
          <Text style={[x.label, { color: '#d94b45' }]}>Sair da conta</Text>
        </Pressable>
        <Text style={[x.version, { color: theme.secondaryText }]}>Versão de testes</Text>
      </View>
    </ScrollView>
  );
}

const x = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  page: { flexGrow: 1, width: '100%', backgroundColor: '#fff' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', flexGrow: 1, paddingVertical: 22 },
  close: { fontSize: 30, color: '#14231d' },
  brand: { paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: '#e5ebe8', marginBottom: 12 },
  logo: { color: green, fontWeight: '900', fontSize: 25 },
  item: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { color: green, fontSize: 25 },
  label: { fontWeight: '700', color: '#14231d' },
  version: { textAlign: 'center', color: '#6f7c76', fontSize: 12, marginTop: 'auto', paddingTop: 32 },
});

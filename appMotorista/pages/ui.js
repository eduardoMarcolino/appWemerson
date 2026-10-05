import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export const green = '#087a50';
export const red = '#d94b45';
export const orange = '#f2a800';
export const ride = {
  origin: 'Praca da Matriz', originArea: 'Centro', destination: 'Shopping Jardins',
  destinationArea: 'Av. das Flores, 123', price: 'R$ 14,50', distance: '4,2 km',
  duration: '12 min', passenger: 'Ana Silva', driver: 'Carlos Lima',
};

export function Button({ children, onPress, light = false, danger = false, disabled = false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[s.button, light && s.lightButton, danger && s.dangerButton, disabled && { opacity: 0.5 }]}><Text style={[s.buttonText, light && s.lightText, danger && s.dangerText]}>{children}</Text></Pressable>;
}

export function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View>; }
export function Field({ value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', multiline = false }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} style={[s.field, multiline && { minHeight: 100, textAlignVertical: 'top' }]} />;
}

export function Page({ children, title, go, back = 'Home', nav, scroll = true }) {
  const content = <View style={s.content}>
    {title && <View style={s.titleRow}><Pressable onPress={() => go(back)}><Text style={s.back}>‹</Text></Pressable><Text style={s.title}>{title}</Text><Pressable onPress={() => go('SideMenu')}><Text style={s.menu}>☰</Text></Pressable></View>}
    {children}
  </View>;
  return <View style={s.page}>{scroll ? <ScrollView contentContainerStyle={s.scroll}>{content}</ScrollView> : content}{nav && <Nav go={go} active={nav} />}</View>;
}

export function Nav({ go, active }) {
  const items = [['Home', 'Inicio'], ['History', 'Corridas'], ['Schedule', 'Agenda'], ['Earnings', 'Ganhos'], ['Profile', 'Conta']];
  return <View style={s.nav}>{items.map(([target, label]) => <Pressable key={target} onPress={() => go(target)} style={s.navItem}><Text style={[s.navText, active === target && s.active]}>{label}</Text></Pressable>)}</View>;
}

export function Location({ color = green, title, detail }) { return <View style={s.location}><View style={[s.dot, { backgroundColor: color }]} /><View><Text style={s.locationTitle}>{title}</Text><Text style={s.muted}>{detail}</Text></View></View>; }
export function Metric({ label, value, strong = false }) { return <View style={s.metric}><Text style={s.muted}>{label}</Text><Text style={[s.metricValue, strong && s.strong]}>{value}</Text></View>; }
export function Avatar({ initials = 'CL' }) { return <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>; }
export function MapPreview() { return <View style={s.map}><View style={s.roadOne} /><View style={s.roadTwo} /><View style={s.route} /><View style={s.startDot} /><View style={s.endDot} /><Text style={s.car}>CARRO</Text></View>; }
export function Divider() { return <View style={s.divider} />; }

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f7f8f7' }, scroll: { flexGrow: 1 }, content: { padding: 18, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }, back: { fontSize: 34, lineHeight: 30, color: '#173629' }, title: { color: '#14231d', fontSize: 18, fontWeight: '800' }, menu: { color: green, fontSize: 24 },
  button: { backgroundColor: green, borderRadius: 10, alignItems: 'center', paddingVertical: 15 }, buttonText: { color: '#fff', fontWeight: '800' }, lightButton: { backgroundColor: '#e5f3ed' }, lightText: { color: green }, dangerButton: { backgroundColor: '#fff0ef' }, dangerText: { color: red }, field: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8e4', borderRadius: 10, padding: 14, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 15, gap: 9, elevation: 2, shadowColor: '#173629', shadowOpacity: 0.06, shadowRadius: 8 }, muted: { color: '#6f7c76', fontSize: 12 },
  location: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 }, locationTitle: { color: '#14231d', fontSize: 14, fontWeight: '800' }, divider: { height: 1, backgroundColor: '#e5ebe8', marginVertical: 3 },
  metric: { flexDirection: 'row', justifyContent: 'space-between' }, metricValue: { color: '#14231d', fontWeight: '800' }, strong: { color: green, fontSize: 18 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#d9efe4', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: green, fontWeight: '900' },
  map: { height: 210, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e9f0ec' }, roadOne: { position: 'absolute', width: 38, height: 300, left: 70, top: -42, backgroundColor: '#dbe7f2', transform: [{ rotate: '28deg' }] }, roadTwo: { position: 'absolute', width: 28, height: 300, right: 78, top: -40, backgroundColor: '#f5f4df', transform: [{ rotate: '-40deg' }] }, route: { position: 'absolute', left: 104, top: 55, width: 4, height: 130, backgroundColor: green, transform: [{ rotate: '-38deg' }] }, startDot: { position: 'absolute', left: 70, top: 55, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1689ff', borderWidth: 3, borderColor: '#fff' }, endDot: { position: 'absolute', right: 68, bottom: 38, width: 20, height: 20, borderRadius: 10, backgroundColor: green }, car: { position: 'absolute', left: '42%', top: '48%', color: '#fff', backgroundColor: '#14231d', padding: 6, borderRadius: 10, fontSize: 10, fontWeight: '900' },
  nav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#e6ebe8', paddingVertical: 13, backgroundColor: '#fff' }, navItem: { paddingHorizontal: 3 }, navText: { color: '#74817b', fontSize: 11, fontWeight: '700' }, active: { color: green },
});

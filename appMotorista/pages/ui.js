import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

export const green = '#087a50';
export const red = '#d94b45';
export const orange = '#f2a800';
export function Button({ children, onPress, light = false, danger = false, disabled = false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[s.button, light && s.lightButton, danger && s.dangerButton, disabled && { opacity: 0.5 }]}><Text style={[s.buttonText, light && s.lightText, danger && s.dangerText]}>{children}</Text></Pressable>;
}

export function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View>; }
export function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', multiline = false, style }) {
  return <View style={s.fieldWrap}>{label ? <Text style={s.fieldLabel}>{label}</Text> : null}<TextInput accessibilityLabel={label || placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} style={[s.field, multiline && { minHeight: 100, textAlignVertical: 'top', color: '#333' }, style]} /></View>;
}

export function Page({ children, title, go, back = 'Home', nav, scroll = true, showMenu = true }) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? 14 : width > 720 ? 28 : 18;
  const content = (
    <View style={[s.contentWidth, { paddingHorizontal: horizontalPadding }]}>
      <View style={s.content}>
        {title && (
          <View style={s.titleRow}>
            <Pressable onPress={() => go(back)} hitSlop={10}>
              <Text style={s.back}>‹</Text>
            </Pressable>
            <Text numberOfLines={2} style={s.title}>{title}</Text>
            {showMenu ? (
              <Pressable onPress={() => go('SideMenu')} hitSlop={10}>
                <Text style={s.menu}>☰</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        {children}
      </View>
    </View>
  );

  return (
    <View style={s.page}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : content}
      {nav && <Nav go={go} active={nav} />}
    </View>
  );
}

export function Nav({ go, active }) {
  const { width } = useWindowDimensions();
  const items = [['Home', 'Inicio'], ['History', 'Corridas'], ['Schedule', 'Agenda'], ['Earnings', 'Ganhos'], ['Profile', 'Conta']];
  return (
    <View style={[s.nav, width < 360 && s.compactNav]}>
      {items.map(([target, label]) => (
        <Pressable key={target} onPress={() => go(target)} style={s.navItem}>
          <Text numberOfLines={1} style={[s.navText, width < 360 && s.compactNavText, active === target && s.active]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Location({ color = green, title, detail }) { return <View style={s.location}><View style={[s.dot, { backgroundColor: color }]} /><View><Text style={s.locationTitle}>{title}</Text><Text style={s.muted}>{detail}</Text></View></View>; }
export function Metric({ label, value, strong = false }) { return <View style={s.metric}><Text style={s.muted}>{label}</Text><Text style={[s.metricValue, strong && s.strong]}>{value}</Text></View>; }
export function Avatar({ initials = 'CL' }) { return <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>; }
export function Divider() { return <View style={s.divider} />; }

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f7f8f7' }, scroll: { flexGrow: 1 }, contentWidth: { width: '100%', maxWidth: 760, alignSelf: 'center' }, content: { paddingVertical: 18, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }, back: { fontSize: 34, lineHeight: 30, color: '#173629' }, title: { flex: 1, color: '#14231d', fontSize: 18, fontWeight: '800', textAlign: 'center' }, menu: { color: green, fontSize: 24 },
  button: { backgroundColor: green, borderRadius: 10, alignItems: 'center', paddingVertical: 15 }, buttonText: { color: '#fff', fontWeight: '800' }, lightButton: { backgroundColor: '#e5f3ed' }, lightText: { color: green }, dangerButton: { backgroundColor: '#fff0ef' }, dangerText: { color: red }, field: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8e4', borderRadius: 10, padding: 14, fontSize: 14, color: '#333' }, fieldWrap: { gap: 6 }, fieldLabel: { color: '#33483e', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 15, gap: 9, elevation: 2, shadowColor: '#173629', shadowOpacity: 0.06, shadowRadius: 8 }, muted: { color: '#6f7c76', fontSize: 12 },
  location: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 }, locationTitle: { color: '#14231d', fontSize: 14, fontWeight: '800' }, divider: { height: 1, backgroundColor: '#e5ebe8', marginVertical: 3 },
  metric: { flexDirection: 'row', justifyContent: 'space-between' }, metricValue: { color: '#14231d', fontWeight: '800' }, strong: { color: green, fontSize: 18 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#d9efe4', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: green, fontWeight: '900' },
  nav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#e6ebe8', paddingVertical: 13, backgroundColor: '#fff' }, compactNav: { paddingHorizontal: 4, paddingVertical: 10 }, navItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 }, navText: { color: '#74817b', fontSize: 11, fontWeight: '700' }, compactNavText: { fontSize: 9 }, active: { color: green },
});

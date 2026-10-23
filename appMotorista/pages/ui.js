import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native';
import { formatDateInput } from './utils/dateInput';

export const green = '#087a50';
export const red = '#d94b45';
export const orange = '#f2a800';

function colorsFor(scheme) {
  const dark = scheme === 'dark';
  return {
    background: dark ? '#101a16' : '#f7f8f7',
    surface: dark ? '#1b2923' : '#fff',
    text: dark ? '#f0f5f2' : '#14231d',
    secondaryText: dark ? '#b0c0b8' : '#6f7c76',
    label: dark ? '#d0ddd6' : '#33483e',
    border: dark ? '#35473e' : '#e2e8e4',
    inputText: dark ? '#f0f5f2' : '#333',
    placeholder: dark ? '#a5b4ac' : '#78847f',
    lightButton: dark ? '#254438' : '#e5f3ed',
    navText: dark ? '#a5b4ac' : '#74817b',
  };
}

export function getThemeColors(scheme) {
  return colorsFor(scheme);
}

export function ThemedText({ style, ...props }) {
  const scheme = useColorScheme();
  return <Text {...props} style={[{ color: colorsFor(scheme).text }, style]} />;
}

function createStyles(scheme) {
  const colors = colorsFor(scheme);
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
    contentWidth: { width: '100%', maxWidth: 760, alignSelf: 'center' },
    content: { paddingVertical: 18, gap: 14 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
    back: { fontSize: 34, lineHeight: 30, color: colors.text },
    title: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    button: { backgroundColor: green, borderRadius: 10, alignItems: 'center', paddingVertical: 15 },
    buttonText: { color: '#fff', fontWeight: '800' },
    lightButton: { backgroundColor: colors.lightButton },
    lightText: { color: scheme === 'dark' ? '#92d3b3' : green },
    dangerButton: { backgroundColor: scheme === 'dark' ? '#482b29' : '#fff0ef' },
    dangerText: { color: scheme === 'dark' ? '#ffaaa3' : red },
    field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 14, color: colors.inputText },
    fieldWrap: { gap: 6 },
    fieldLabel: { color: colors.label, fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 15, gap: 9, elevation: 2, shadowColor: '#173629', shadowOpacity: 0.06, shadowRadius: 8 },
    muted: { color: colors.secondaryText, fontSize: 12 },
    location: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    locationTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 3 },
    metric: { flexDirection: 'row', justifyContent: 'space-between' },
    metricValue: { color: colors.text, fontWeight: '800' },
    strong: { color: scheme === 'dark' ? '#92d3b3' : green, fontSize: 18 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: scheme === 'dark' ? '#254438' : '#d9efe4', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: scheme === 'dark' ? '#92d3b3' : green, fontWeight: '900' },
    nav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 13, backgroundColor: colors.surface },
    compactNav: { paddingHorizontal: 4, paddingVertical: 10 },
    navItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
    navText: { color: colors.navText, fontSize: 11, fontWeight: '700' },
    compactNavText: { fontSize: 9 },
    active: { color: scheme === 'dark' ? '#92d3b3' : green },
    h2: { fontSize: 20, fontWeight: '700', color: scheme === 'dark' ? '#d5eee2' : '#173629' },
  });
}

let activeScheme = 'light';
export let s = createStyles(activeScheme);

export function setColorScheme(scheme) {
  const nextScheme = scheme === 'dark' ? 'dark' : 'light';
  if (activeScheme !== nextScheme) {
    activeScheme = nextScheme;
    s = createStyles(activeScheme);
  }
}

function formatFieldValue(value, label) {
  const name = (label || '').toLowerCase();
  if (name.includes('data') || name.includes('validade')) return formatDateInput(value);
  if (!name.includes('cpf') && !name.includes('cep') && !name.includes('telefone')) return value;
  const rawValue = String(value || '');
  if (name.includes('cpf') && /[a-z@]/i.test(rawValue)) return rawValue;
  const digits = rawValue.replace(/\D/g, '');
  if (name.includes('cpf')) {
    const limited = digits.slice(0, 11);
    return limited
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  if (name.includes('cep')) return digits.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  const limited = digits.slice(0, 11);
  if (limited.length <= 2) return limited ? `(${limited}` : '';
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

export function Button({ children, onPress, light = false, danger = false, disabled = false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[s.button, light && s.lightButton, danger && s.dangerButton, disabled && { opacity: 0.5 }]}><Text style={[s.buttonText, light && s.lightText, danger && s.dangerText]}>{children}</Text></Pressable>;
}

export function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View>; }
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  style,
}) {
  const scheme = useColorScheme();
  const colors = colorsFor(scheme);
  const visibleLabel = label || placeholder || 'Campo';
  return <View style={s.fieldWrap}><Text style={s.fieldLabel}>{visibleLabel}</Text><TextInput accessibilityLabel={visibleLabel} accessibilityHint={placeholder} value={formatFieldValue(value, visibleLabel)} onChangeText={(text) => onChangeText?.(formatFieldValue(text, visibleLabel))} placeholder={placeholder} placeholderTextColor={colors.placeholder} secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} maxLength={maxLength} onSubmitEditing={onSubmitEditing} returnKeyType={returnKeyType} style={[s.field, multiline && { minHeight: 100, textAlignVertical: 'top' }, style]} /></View>;
}

export function Page({ children, title, go, back = 'Home', nav, scroll = true }) {
  useColorScheme();
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
  useColorScheme();
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

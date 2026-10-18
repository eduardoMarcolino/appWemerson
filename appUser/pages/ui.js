import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

export const green = '#087a50';

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
    buttonLight: dark ? '#254438' : '#e5f3ed',
    navText: dark ? '#a5b4ac' : '#7a8781',
    mutedSurface: dark ? '#24342d' : '#dcebe5',
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
    scroll: {
      flexGrow: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      padding: 20,
      gap: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 8,
    },
    back: {
      fontSize: 34,
      color: colors.text,
      lineHeight: 30,
    },
    title: {
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    button: {
      backgroundColor: green,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700',
    },
    light: {
      backgroundColor: colors.buttonLight,
    },
    lightText: {
      color: scheme === 'dark' ? '#92d3b3' : green,
    },
    field: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 14,
      color: colors.inputText,
    },
    fieldWrap: { gap: 6 },
    fieldLabel: { color: colors.label, fontSize: 13, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 15,
      shadowColor: '#173629',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    nav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      padding: 10,
    },
    navItem: {
      alignItems: 'center',
      gap: 3,
    },
    navIcon: {
      color: colors.navText,
      fontSize: 18,
    },
    navText: {
      color: colors.navText,
      fontSize: 10,
    },
    active: {
      color: scheme === 'dark' ? '#92d3b3' : green,
      fontWeight: '700',
    },
    h2: {
      fontSize: 20,
      fontWeight: '700',
      color: scheme === 'dark' ? '#d5eee2' : '#173629',
    },
    muted: {
      color: colors.secondaryText,
      fontSize: 12,
      lineHeight: 18,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
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
  if (name.includes('cep')) {
    return digits.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  }
  const limited = digits.slice(0, 11);
  if (limited.length <= 2) return limited ? `(${limited}` : '';
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

export function Button({ children, onPress, light = false, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[s.button, light && s.light, disabled && { opacity: 0.5 }]}
    >
      <Text style={[s.buttonText, light && s.lightText]}>{children}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  placeholder,
  value,
  secureTextEntry = false,
  onChangeText,
  keyboardType,
  multiline = false,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  style,
}) {
  const scheme = useColorScheme();
  const colors = colorsFor(scheme);
  const visibleLabel = label || placeholder || 'Campo';
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{visibleLabel}</Text>
      <TextInput
        accessibilityLabel={visibleLabel}
        accessibilityHint={placeholder}
        placeholder={placeholder}
        value={formatFieldValue(value, visibleLabel)}
        secureTextEntry={secureTextEntry}
        onChangeText={(text) => onChangeText?.(formatFieldValue(text, visibleLabel))}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        placeholderTextColor={colors.placeholder}
        style={[s.field, multiline && { minHeight: 100, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

export function Page({ title, children, go, back = 'Home', scroll = true }) {
  useColorScheme();
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? 14 : width > 720 ? 28 : 20;

  const body = (
    <View style={[s.content, { paddingHorizontal: horizontalPadding }]}>
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
  );

  return scroll ? (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      {body}
    </ScrollView>
  ) : (
    body
  );
}

export function Card({ children, style }) {
  useColorScheme();
  return <View style={[s.card, style]}>{children}</View>;
}

export function Nav({ go, active = 'Home' }) {
  useColorScheme();
  const { width } = useWindowDimensions();
  const items = [
    ['Home', '⌂'],
    ['CityEvents', '▦'],
    ['SearchDestination', '🚗'],
    ['History', '◷'],
    ['Profile', '♙'],
  ];

  return (
    <View style={[s.nav, { paddingHorizontal: width < 360 ? 6 : 10 }]}>
      {items.map(([screen, icon]) => (
        <Pressable key={screen} onPress={() => go(screen)} style={s.navItem} hitSlop={6}>
          <Text style={[s.navIcon, active === screen && s.active]}>{icon}</Text>
          <Text
            numberOfLines={1}
            style={[s.navText, active === screen && s.active]}
          >
            {screen === 'CityEvents'
              ? 'Eventos'
              : screen === 'SearchDestination'
              ? 'Corrida'
              : screen === 'History'
              ? 'Histórico'
              : screen === 'Profile'
              ? 'Perfil'
              : 'Home'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

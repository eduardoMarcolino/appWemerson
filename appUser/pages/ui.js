import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

export const green = '#087a50';

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

export function Field({ placeholder, value, secureTextEntry = false, onChangeText, keyboardType }) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      secureTextEntry={secureTextEntry}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#78847f"
      style={s.field}
    />
  );
}

export function Page({ title, children, go, back = 'Home', scroll = true }) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? 14 : width > 700 ? 24 : 20;

  const body = (
    <View style={[s.content, { paddingHorizontal: horizontalPadding }]}>
      {title && (
        <View style={s.titleRow}>
          <Pressable onPress={() => go(back)} hitSlop={10}>
            <Text style={s.back}>‹</Text>
          </Pressable>
          <Text style={s.title}>{title}</Text>
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
  return <View style={[s.card, style]}>{children}</View>;
}

export function Nav({ go, active = 'Home' }) {
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

export const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: '#f7f8f7',
  },
  content: {
    flex: 1,
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
    color: '#183c2d',
    lineHeight: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14231d',
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
    backgroundColor: '#e5f3ed',
  },
  lightText: {
    color: green,
  },
  field: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8e4',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderTopColor: '#e6ebe8',
    borderTopWidth: 1,
    padding: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navIcon: {
    color: '#7a8781',
    fontSize: 18,
  },
  navText: {
    color: '#7a8781',
    fontSize: 10,
  },
  active: {
    color: green,
    fontWeight: '700',
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#173629',
  },
  muted: {
    color: '#6f7c76',
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
